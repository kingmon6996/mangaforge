import uuid
from datetime import datetime, timezone
from io import BytesIO
from urllib.parse import unquote, urlsplit

from flask import Blueprint, current_app, g, jsonify, request
from PIL import Image, UnidentifiedImageError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.utils import secure_filename

from ..extensions import db
from ..handlers.auth_handler import authenticated_user
from ..handlers.export_renderer import ExportRenderError, render_export
from ..handlers.errors import AuthError
from ..handlers.storage import (
    StorageError,
    delete_object,
    hydrate_storage_references,
    normalize_storage_urls,
    signed_url,
    upload_object,
)
from ..models import StudioAsset, StudioCharacter, StudioExport, StudioProject, StudioStory

studio_routes = Blueprint("studio", __name__)

TEMPLATES = [
    {
        "id": "tpl-1",
        "name": "Dynamic Action 5-Panel",
        "category": "Action",
        "panelCount": 5,
        "description": "Wide center kinetic splash flanked by fast beat panels above and below.",
        "presetKey": "dynamic-action",
    },
    {
        "id": "tpl-2",
        "name": "Classic 4-Panel Editorial",
        "category": "Dialogue",
        "panelCount": 4,
        "description": "Balanced 2x2 grid ideal for character exchanges and steady pacing.",
        "presetKey": "four-panel-grid",
    },
    {
        "id": "tpl-3",
        "name": "Heroic Splash Reveal",
        "category": "Splash",
        "panelCount": 3,
        "description": "Dominant two-thirds upper canvas paired with two reaction panels.",
        "presetKey": "splash-focus",
    },
    {
        "id": "tpl-4",
        "name": "Dialogue Strip Progression",
        "category": "Opening",
        "panelCount": 4,
        "description": "Three horizontal tiers with a split middle beat for conversational tension.",
        "presetKey": "dialogue-strip",
    },
    {
        "id": "tpl-5",
        "name": "Cinematic Widescreen",
        "category": "Climax",
        "panelCount": 3,
        "description": "Three stacked anamorphic panels for quiet suspense or duel standoffs.",
        "presetKey": "cinematic-widescreen",
    },
]
ALLOWED_GENRES = {"Shonen", "Shojo", "Seinen", "Horror", "Romance", "Fantasy", "Action", "Sci-Fi"}
ALLOWED_CHARACTER_ROLES = {
    "Protagonist",
    "Deuteragonist",
    "Antagonist",
    "Supporting",
    "Mentor",
}
ALLOWED_IMAGE_FORMATS = {
    "JPEG": ("image/jpeg", "jpg"),
    "PNG": ("image/png", "png"),
    "WEBP": ("image/webp", "webp"),
}
EXPORT_OPTIONS = {
    "format": {"PDF", "PNG", "JPEG"},
    "resolution": {"150 DPI", "300 DPI", "600 DPI"},
    "pageSize": {"B5 Manga", "A4 Editorial", "US Tankobon", "Webtoon Vertical"},
    "scope": {"Single Page", "Complete Chapter"},
    "quality": {"Standard", "Print Master"},
    "colorMode": {"Grayscale", "Color"},
}
PAGE_WIDTH = 720
PAGE_HEIGHT = 1020


@studio_routes.before_request
def require_studio_user():
    if request.method == "OPTIONS":
        return None
    user = authenticated_user()
    if not user:
        return jsonify(
            {
                "success": False,
                "code": "UNAUTHORIZED",
                "message": "Sign in to access your studio.",
            }
        ), 401
    g.studio_user = user


@studio_routes.errorhandler(AuthError)
def handle_studio_auth_error(error: AuthError):
    return jsonify({"success": False, "code": error.code, "message": str(error)}), error.status_code


@studio_routes.errorhandler(StorageError)
def handle_storage_error(error: StorageError):
    current_app.logger.error("Studio storage operation failed: %s", error)
    return jsonify({"success": False, "code": "STORAGE_UNAVAILABLE", "message": str(error)}), 503


@studio_routes.errorhandler(ExportRenderError)
def handle_export_error(error: ExportRenderError):
    return jsonify({"success": False, "code": "EXPORT_FAILED", "message": str(error)}), 422


def _json_body() -> dict:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise AuthError("A JSON request body is required.", 400, "INVALID_REQUEST")
    return payload


def _required_text(payload: dict, key: str, max_length: int) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > max_length:
        raise AuthError(f"Enter a valid {key.replace('_', ' ')}.", 400, "INVALID_REQUEST")
    return value.strip()


def _user_id() -> str:
    return g.studio_user.id


def _project_json(record: StudioProject) -> dict:
    payload = hydrate_storage_references(record.payload)
    payload["id"] = record.id
    payload["title"] = record.title
    payload["createdAt"] = record.created_at.isoformat()
    payload["updatedAt"] = record.updated_at.isoformat()
    return payload


def _character_json(record: StudioCharacter) -> dict:
    payload = hydrate_storage_references(record.payload)
    payload["id"] = record.id
    payload["name"] = record.name
    payload["updatedAt"] = record.updated_at.isoformat()
    return payload


def _story_json(record: StudioStory) -> dict:
    payload = dict(record.payload)
    payload["id"] = record.id
    payload["title"] = record.title
    payload["updatedAt"] = record.updated_at.isoformat()
    return payload


def _asset_json(record: StudioAsset) -> dict:
    return {
        **record.payload,
        "id": record.id,
        "title": record.title,
        "category": record.category,
        "imageUrl": signed_url(record.storage_path),
        "storagePath": record.storage_path,
        "createdAt": record.created_at.isoformat(),
    }


def _export_json(record: StudioExport) -> dict:
    payload = dict(record.payload)
    result = {
        **payload,
        "id": record.id,
        "projectId": record.project_id,
        "status": record.status,
        "progress": record.progress,
        "createdAt": record.created_at.isoformat(),
    }
    if record.artifact_path:
        result["downloadUrl"] = signed_url(
            record.artifact_path,
            record.payload.get("downloadFilename"),
        )
    return result


def _not_found(resource: str):
    return jsonify(
        {"success": False, "code": "NOT_FOUND", "message": f"{resource} was not found."}
    ), 404


def _frontend_asset_url(value) -> str:
    if not isinstance(value, str) or not value:
        return ""
    frontend_origin = current_app.config["FRONTEND_ORIGIN"].rstrip("/")
    if value.startswith("/"):
        value = f"{frontend_origin}{value}"
    parsed = urlsplit(value)
    expected = urlsplit(frontend_origin)
    path_segments = unquote(parsed.path).split("/")
    if (
        (parsed.scheme, parsed.netloc) != (expected.scheme, expected.netloc)
        or not parsed.path.startswith("/assets/")
        or ".." in path_segments
    ):
        return ""
    return value


def _panel(
    page_id: str,
    index: int,
    x: float,
    y: float,
    width: float,
    height: float,
    image_url: str,
    screentone: str = "none",
) -> dict:
    return {
        "id": f"{page_id}-panel-{index + 1}",
        "type": "panel",
        "name": f"Panel {index + 1}",
        "x": round(x),
        "y": round(y),
        "width": round(width),
        "height": round(height),
        "rotation": 0,
        "visible": True,
        "locked": False,
        "zIndex": index + 1,
        "opacity": 100,
        "borderWidth": 3,
        "borderStyle": "solid",
        "cornerShape": "sharp",
        "backgroundColor": "#FFFFFF",
        "screentone": screentone,
        "imageUrl": image_url,
        "imageBrightness": 100,
        "imageContrast": 105,
        "imageFlipX": False,
    }


def _panel_layout(page_id: str, panel_count: int, artwork: list[str]) -> list[dict]:
    margin = 32
    gutter = 14
    inner_width = PAGE_WIDTH - margin * 2
    inner_height = PAGE_HEIGHT - margin * 2
    boxes = []
    if panel_count >= 5:
        row_one = inner_height * 0.32
        row_two = inner_height * 0.38
        row_three = inner_height - row_one - row_two - gutter * 2
        boxes = [
            (margin, margin, inner_width * 0.62 - gutter / 2, row_one, "none"),
            (margin + inner_width * 0.62 + gutter / 2, margin, inner_width * 0.38 - gutter / 2, row_one, "dense"),
            (margin, margin + row_one + gutter, inner_width, row_two, "speedlines"),
            (margin, margin + row_one + row_two + gutter * 2, inner_width * 0.45 - gutter / 2, row_three, "none"),
            (margin + inner_width * 0.45 + gutter / 2, margin + row_one + row_two + gutter * 2, inner_width * 0.55 - gutter / 2, row_three, "light"),
        ]
    elif panel_count == 3:
        top_height = inner_height * 0.68 - gutter / 2
        lower_y = margin + inner_height * 0.68 + gutter / 2
        lower_height = inner_height * 0.32 - gutter / 2
        boxes = [
            (margin, margin, inner_width, top_height, "speedlines"),
            (margin, lower_y, inner_width * 0.48 - gutter / 2, lower_height, "light"),
            (margin + inner_width * 0.48 + gutter / 2, lower_y, inner_width * 0.52 - gutter / 2, lower_height, "none"),
        ]
    else:
        column_width = (inner_width - gutter) / 2
        row_height = (inner_height - gutter) / 2
        boxes = [
            (margin, margin, column_width, row_height, "none"),
            (margin + column_width + gutter, margin, column_width, row_height, "light"),
            (margin, margin + row_height + gutter, column_width, row_height, "none"),
            (margin + column_width + gutter, margin + row_height + gutter, column_width, row_height, "none"),
        ]
    return [
        _panel(page_id, index, *box[:4], artwork[index % len(artwork)] if artwork else "", box[4])
        for index, box in enumerate(boxes)
    ]


@studio_routes.get("/projects")
def list_projects():
    records = db.session.execute(
        select(StudioProject)
        .where(StudioProject.user_id == _user_id())
        .order_by(StudioProject.updated_at.desc())
    ).scalars()
    return jsonify([_project_json(record) for record in records])


@studio_routes.post("/projects")
def create_project():
    payload = _json_body()
    title = _required_text(payload, "title", 200)
    project_id = payload.get("id") or f"proj-{uuid.uuid4()}"
    if not isinstance(project_id, str) or not project_id or len(project_id) > 80:
        raise AuthError("Enter a valid project id.", 400, "INVALID_REQUEST")
    if db.session.get(StudioProject, project_id):
        raise AuthError("A project with this id already exists.", 409, "RESOURCE_EXISTS")

    now = datetime.now(timezone.utc).isoformat()
    stored_payload = normalize_storage_urls(payload)
    stored_payload["id"] = project_id
    stored_payload["title"] = title
    stored_payload["createdAt"] = stored_payload.get("createdAt") or now
    stored_payload["updatedAt"] = now
    record = StudioProject(
        id=project_id,
        user_id=_user_id(),
        title=title,
        payload=stored_payload,
    )
    db.session.add(record)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise AuthError("A project with this id already exists.", 409, "RESOURCE_EXISTS") from None
    except SQLAlchemyError:
        db.session.rollback()
        raise
    return jsonify(_project_json(record)), 201


@studio_routes.get("/projects/<project_id>")
def get_project(project_id: str):
    record = db.session.execute(
        select(StudioProject).where(
            StudioProject.id == project_id,
            StudioProject.user_id == _user_id(),
        )
    ).scalar_one_or_none()
    return jsonify(_project_json(record)) if record else _not_found("Project")


@studio_routes.patch("/projects/<project_id>")
def update_project(project_id: str):
    payload = _json_body()
    record = db.session.execute(
        select(StudioProject).where(
            StudioProject.id == project_id,
            StudioProject.user_id == _user_id(),
        )
    ).scalar_one_or_none()
    if not record:
        return _not_found("Project")
    if payload.get("id", project_id) != project_id:
        raise AuthError("Project id cannot be changed.", 400, "INVALID_REQUEST")
    title = _required_text(payload, "title", 200)
    now = datetime.now(timezone.utc).isoformat()
    stored_payload = normalize_storage_urls(payload)
    stored_payload["id"] = project_id
    stored_payload["title"] = title
    stored_payload["updatedAt"] = now
    record.title = title
    record.payload = stored_payload
    record.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(_project_json(record))


@studio_routes.delete("/projects/<project_id>")
def delete_project(project_id: str):
    record = db.session.execute(
        select(StudioProject).where(
            StudioProject.id == project_id,
            StudioProject.user_id == _user_id(),
        )
    ).scalar_one_or_none()
    if not record:
        return _not_found("Project")
    db.session.delete(record)
    db.session.commit()
    return "", 204


@studio_routes.post("/projects/<project_id>/duplicate")
def duplicate_project(project_id: str):
    source = db.session.execute(
        select(StudioProject).where(
            StudioProject.id == project_id,
            StudioProject.user_id == _user_id(),
        )
    ).scalar_one_or_none()
    if not source:
        return _not_found("Project")
    now = datetime.now(timezone.utc).isoformat()
    duplicate_id = f"proj-{uuid.uuid4()}"
    payload = dict(source.payload)
    payload.update(
        {
            "id": duplicate_id,
            "title": f"{source.title} (Copy)",
            "status": "Draft",
            "createdAt": now,
            "updatedAt": now,
        }
    )
    duplicate = StudioProject(
        id=duplicate_id,
        user_id=_user_id(),
        title=payload["title"],
        payload=payload,
    )
    db.session.add(duplicate)
    db.session.commit()
    return jsonify(_project_json(duplicate)), 201


@studio_routes.get("/characters")
def list_characters():
    records = db.session.execute(
        select(StudioCharacter)
        .where(StudioCharacter.user_id == _user_id())
        .order_by(StudioCharacter.updated_at.desc())
    ).scalars()
    return jsonify([_character_json(record) for record in records])


@studio_routes.post("/characters")
def create_character():
    payload = _json_body()
    name = _required_text(payload, "name", 200)
    character_id = payload.get("id") or f"char-{uuid.uuid4()}"
    if not isinstance(character_id, str) or not character_id or len(character_id) > 80:
        raise AuthError("Enter a valid character id.", 400, "INVALID_REQUEST")
    if db.session.get(StudioCharacter, character_id):
        raise AuthError("A character with this id already exists.", 409, "RESOURCE_EXISTS")
    payload = normalize_storage_urls(payload)
    payload["id"] = character_id
    payload["name"] = name
    payload["updatedAt"] = datetime.now(timezone.utc).isoformat()
    record = StudioCharacter(
        id=character_id,
        user_id=_user_id(),
        name=name,
        payload=payload,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(_character_json(record)), 201


@studio_routes.patch("/characters/<character_id>")
def update_character(character_id: str):
    payload = _json_body()
    record = db.session.execute(
        select(StudioCharacter).where(
            StudioCharacter.id == character_id,
            StudioCharacter.user_id == _user_id(),
        )
    ).scalar_one_or_none()
    if not record:
        return _not_found("Character")
    if payload.get("id", character_id) != character_id:
        raise AuthError("Character id cannot be changed.", 400, "INVALID_REQUEST")
    name = _required_text(payload, "name", 200)
    payload = normalize_storage_urls(payload)
    payload["id"] = character_id
    payload["name"] = name
    payload["updatedAt"] = datetime.now(timezone.utc).isoformat()
    record.name = name
    record.payload = payload
    record.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(_character_json(record))


@studio_routes.delete("/characters/<character_id>")
def delete_character(character_id: str):
    record = db.session.execute(
        select(StudioCharacter).where(
            StudioCharacter.id == character_id,
            StudioCharacter.user_id == _user_id(),
        )
    ).scalar_one_or_none()
    if not record:
        return _not_found("Character")
    db.session.delete(record)
    db.session.commit()
    return "", 204


@studio_routes.get("/stories")
def list_stories():
    records = db.session.execute(
        select(StudioStory)
        .where(StudioStory.user_id == _user_id())
        .order_by(StudioStory.updated_at.desc())
    ).scalars()
    return jsonify([_story_json(record) for record in records])


@studio_routes.post("/stories")
def create_story():
    payload = _json_body()
    title = _required_text(payload, "title", 200)
    story_id = payload.get("id") or f"story-{uuid.uuid4()}"
    if not isinstance(story_id, str) or not story_id or len(story_id) > 80:
        raise AuthError("Enter a valid story id.", 400, "INVALID_REQUEST")
    if db.session.get(StudioStory, story_id):
        raise AuthError("A story with this id already exists.", 409, "RESOURCE_EXISTS")
    payload["id"] = story_id
    payload["title"] = title
    payload["updatedAt"] = datetime.now(timezone.utc).isoformat()
    record = StudioStory(
        id=story_id,
        user_id=_user_id(),
        title=title,
        payload=payload,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(_story_json(record)), 201


@studio_routes.get("/templates")
def list_templates():
    return jsonify(TEMPLATES)


@studio_routes.post("/generation/manga")
def create_manga_scaffold():
    payload = _json_body()
    title = _required_text(payload, "title", 200)
    character_name = _required_text(payload, "characterName", 200)
    genre = payload.get("genre")
    role = payload.get("characterRole")
    if genre not in ALLOWED_GENRES or role not in ALLOWED_CHARACTER_ROLES:
        raise AuthError("Choose a valid manga genre and character role.", 400, "INVALID_REQUEST")

    chapters_count = payload.get("chaptersCount")
    pages_per_chapter = payload.get("pagesPerChapter")
    panel_count = payload.get("panelsPerPage")
    if (
        type(chapters_count) is not int
        or type(pages_per_chapter) is not int
        or type(panel_count) is not int
        or not 1 <= chapters_count <= 12
        or not 1 <= pages_per_chapter <= 24
        or not 1 <= panel_count <= 5
        or chapters_count * pages_per_chapter > 120
    ):
        raise AuthError(
            "Choose 1–12 chapters and 1–24 pages per chapter (up to 120 pages total).",
            400,
            "INVALID_REQUEST",
        )

    now = datetime.now(timezone.utc).isoformat()
    project_id = f"proj-{uuid.uuid4()}"
    character_id = f"char-{uuid.uuid4()}"
    chapter_ids = [f"ch-{uuid.uuid4()}" for _ in range(chapters_count)]
    panel_artwork = payload.get("panelArtworkUrls", [])
    if not isinstance(panel_artwork, list):
        raise AuthError("Panel artwork must be a list of image URLs.", 400, "INVALID_REQUEST")
    artwork_urls = [
        _frontend_asset_url(value)
        for value in panel_artwork
        if isinstance(value, str)
    ]
    artwork_urls = [value for value in artwork_urls if value]
    cover_image_url = _frontend_asset_url(payload.get("coverImageUrl")) or (
        artwork_urls[0] if artwork_urls else ""
    )
    reference_image_url = _frontend_asset_url(payload.get("characterReferenceImageUrl"))
    story_content = payload.get("storyContent")
    if not isinstance(story_content, str):
        story_content = ""
    synopsis = story_content.strip()[:140]
    chapters = [
        {
            "id": chapter_id,
            "number": index + 1,
            "title": f"Chapter {index + 1:02d}: {title}",
            "synopsis": synopsis,
        }
        for index, chapter_id in enumerate(chapter_ids)
    ]

    pages = []
    for chapter_index, chapter_id in enumerate(chapter_ids):
        for page_index in range(pages_per_chapter):
            page_id = f"pg-{uuid.uuid4()}"
            elements = _panel_layout(page_id, panel_count, artwork_urls)
            if payload.get("dialogueGeneration") and synopsis:
                elements.append(
                    {
                        "id": f"{page_id}-opening-dialogue",
                        "type": "bubble",
                        "name": "Opening Dialogue",
                        "x": 68,
                        "y": 54,
                        "width": 260,
                        "height": 92,
                        "rotation": 0,
                        "visible": True,
                        "locked": False,
                        "zIndex": len(elements) + 1,
                        "opacity": 100,
                        "text": f'{character_name}: "{synopsis}"',
                        "bubbleStyle": "speech",
                        "tailDirection": "bottom-right",
                        "fontSize": 13,
                        "textAlign": "center",
                        "borderWidth": 2,
                        "fontWeight": 600,
                    }
                )
            pages.append(
                {
                    "id": page_id,
                    "pageNumber": page_index + 1,
                    "chapterId": chapter_id,
                    "title": f"Page {page_index + 1}",
                    "gutterSize": 14,
                    "backgroundColor": "#FFFFFF",
                    "elements": elements,
                }
            )

    character = {
        "id": character_id,
        "name": character_name,
        "role": role,
        "personality": payload.get("characterPersonality", ""),
        "hairstyle": payload.get("characterHairstyle", ""),
        "facialFeatures": payload.get("characterFacialFeatures", ""),
        "clothing": payload.get("characterClothing", ""),
        "bodyType": payload.get("characterBodyType", ""),
        "appearanceSummary": ", ".join(
            part
            for part in (
                payload.get("characterHairstyle", ""),
                payload.get("characterClothing", ""),
            )
            if isinstance(part, str) and part.strip()
        ),
        "consistencyNotes": payload.get("characterNotes")
        or "Maintain a consistent silhouette across panels.",
        "referenceImageUrl": reference_image_url,
        "expressions": [
            {"id": f"{character_id}-neutral", "label": "Neutral Focus", "notes": "Storyboard reference"},
            {"id": f"{character_id}-action", "label": "Action Intensity", "notes": "Dramatic ink shading"},
        ],
        "associatedProjectIds": [project_id],
        "updatedAt": now,
    }
    project = {
        "id": project_id,
        "title": title,
        "description": payload.get("description", ""),
        "genre": genre,
        "artStyle": payload.get("artStyle", "Black-and-white manga"),
        "targetAudience": payload.get("targetAudience", ""),
        "language": payload.get("language", "English"),
        "readingDirection": "rtl",
        "status": "In Production",
        "coverImageUrl": cover_image_url,
        "chapters": chapters,
        "pages": pages,
        "characterIds": [character_id],
        "createdAt": now,
        "updatedAt": now,
    }
    project_record = StudioProject(
        id=project_id,
        user_id=_user_id(),
        title=title,
        payload=normalize_storage_urls(project),
    )
    character_record = StudioCharacter(
        id=character_id,
        user_id=_user_id(),
        name=character_name,
        payload=normalize_storage_urls(character),
    )
    db.session.add_all([project_record, character_record])
    db.session.commit()
    return jsonify(
        {
            "project": _project_json(project_record),
            "character": _character_json(character_record),
        }
    ), 201


@studio_routes.post("/generation/editor-action")
def editor_ai_action_not_configured():
    return jsonify(
        {
            "success": False,
            "code": "AI_PROVIDER_NOT_CONFIGURED",
            "message": "AI editor actions are not configured yet. Use the local editor tools or configure an AI provider.",
        }
    ), 501


@studio_routes.get("/assets")
def list_assets():
    records = db.session.execute(
        select(StudioAsset)
        .where(StudioAsset.user_id == _user_id())
        .order_by(StudioAsset.created_at.desc())
    ).scalars()
    return jsonify([_asset_json(record) for record in records])


@studio_routes.post("/assets")
def upload_asset():
    file = request.files.get("file")
    if not file or not file.filename:
        raise AuthError("Choose an image to upload.", 400, "MISSING_FILE")
    data = file.stream.read(current_app.config["UPLOAD_MAX_BYTES"] + 1)
    if len(data) > current_app.config["UPLOAD_MAX_BYTES"]:
        raise AuthError("Image exceeds the 20 MB upload limit.", 413, "FILE_TOO_LARGE")
    try:
        image = Image.open(BytesIO(data))
        image_format = image.format or ""
        if image.width * image.height > 40_000_000:
            raise AuthError("Image has too many pixels to upload.", 413, "IMAGE_TOO_LARGE")
        image.verify()
    except AuthError:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise AuthError("Upload a valid JPEG, PNG, or WebP image.", 400, "INVALID_IMAGE") from None
    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise AuthError("Upload a valid JPEG, PNG, or WebP image.", 400, "INVALID_IMAGE")
    media_type, extension = ALLOWED_IMAGE_FORMATS[image_format]
    original_name = secure_filename(file.filename)
    title = original_name.rsplit(".", 1)[0][:255] or "Uploaded artwork"
    asset_id = f"asset-{uuid.uuid4()}"
    path = f"users/{_user_id()}/assets/{asset_id}.{extension}"
    upload_object(path, data, media_type)

    record = StudioAsset(
        id=asset_id,
        user_id=_user_id(),
        title=title,
        category="Uploaded",
        media_type=media_type,
        storage_path=path,
        payload={"tags": [], "size": len(data)},
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(_asset_json(record)), 201


@studio_routes.delete("/assets/<asset_id>")
def delete_asset(asset_id: str):
    record = db.session.execute(
        select(StudioAsset).where(
            StudioAsset.id == asset_id,
            StudioAsset.user_id == _user_id(),
        )
    ).scalar_one_or_none()
    if not record:
        return _not_found("Asset")
    delete_object(record.storage_path)
    db.session.delete(record)
    db.session.commit()
    return "", 204


@studio_routes.get("/exports")
def list_exports():
    records = db.session.execute(
        select(StudioExport)
        .where(StudioExport.user_id == _user_id())
        .order_by(StudioExport.created_at.desc())
    ).scalars()
    return jsonify([_export_json(record) for record in records])


@studio_routes.get("/exports/<export_id>")
def get_export(export_id: str):
    record = db.session.execute(
        select(StudioExport).where(
            StudioExport.id == export_id,
            StudioExport.user_id == _user_id(),
        )
    ).scalar_one_or_none()
    return jsonify(_export_json(record)) if record else _not_found("Export")


@studio_routes.post("/exports")
def create_export():
    payload = _json_body()
    project_id = payload.get("projectId")
    if not isinstance(project_id, str) or not project_id:
        raise AuthError("Choose a project to export.", 400, "INVALID_REQUEST")
    settings = {}
    for key, allowed in EXPORT_OPTIONS.items():
        value = payload.get(key)
        if value not in allowed:
            raise AuthError(f"Choose a valid export {key}.", 400, "INVALID_REQUEST")
        settings[key] = value
    if type(payload.get("includeDialogue")) is not bool:
        raise AuthError("Choose whether the export includes dialogue.", 400, "INVALID_REQUEST")
    settings["includeDialogue"] = payload["includeDialogue"]

    project_record = db.session.execute(
        select(StudioProject).where(
            StudioProject.id == project_id,
            StudioProject.user_id == _user_id(),
        )
    ).scalar_one_or_none()
    if not project_record:
        return _not_found("Project")

    slug = secure_filename(project_record.title).lower().replace("_", "-").strip("-") or "manga"
    export_id = f"export-{uuid.uuid4()}"
    record = StudioExport(
        id=export_id,
        user_id=_user_id(),
        project_id=project_id,
        status="Rendering",
        progress=25,
        payload={
            **settings,
            "projectTitle": project_record.title,
            "downloadFilename": "",
        },
    )
    db.session.add(record)
    db.session.commit()

    try:
        file_data, media_type, filename = render_export(
            _project_json(project_record),
            settings,
            f"{slug}-{export_id.removeprefix('export-')}",
        )
        storage_path = f"users/{_user_id()}/exports/{export_id}/{filename}"
        upload_object(storage_path, file_data, media_type)
    except ExportRenderError as error:
        record.status = "Failed"
        record.progress = 0
        record.payload = {**record.payload, "error": str(error)}
        db.session.commit()
        return jsonify({"success": False, "code": "EXPORT_FAILED", "message": str(error)}), 422
    except StorageError as error:
        record.status = "Failed"
        record.progress = 0
        record.payload = {**record.payload, "error": str(error)}
        db.session.commit()
        return jsonify({"success": False, "code": "STORAGE_UNAVAILABLE", "message": str(error)}), 503

    record.artifact_path = storage_path
    record.status = "Completed"
    record.progress = 100
    record.payload = {**record.payload, "downloadFilename": filename}
    db.session.commit()
    return jsonify(_export_json(record)), 201
