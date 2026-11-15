import hashlib
import io
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from PIL import Image
from werkzeug.security import generate_password_hash

from backend import create_app
from backend.extensions import db
from backend.models import StudioAsset, StudioCharacter, StudioExport, StudioProject, StudioStory, User, UserSession


class StudioRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret",
                "SQLALCHEMY_DATABASE_URI": "sqlite://",
                "FRONTEND_ORIGIN": "http://localhost:3000",
                "SUPABASE_URL": "https://storage.example",
                "SUPABASE_SERVICE_ROLE_KEY": "test-storage-key",
                "SUPABASE_STUDIO_BUCKET": "mangaforge-studio",
                "UPLOAD_MAX_BYTES": 1024 * 1024,
            }
        )
        self.client = self.app.test_client()
        self.headers = {"Authorization": f"Bearer {self._create_user('creator@example.com')}"}

    def tearDown(self) -> None:
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()

    def _create_user(self, email: str) -> str:
        with self.app.app_context():
            user = User(
                email=email,
                name="Creator",
                password_hash=generate_password_hash("StrongPass1!"),
            )
            token = f"token-{email}"
            session = UserSession(
                token_hash=hashlib.sha256(token.encode()).hexdigest(),
                user_id=user.id,
                expires_at=datetime.now(timezone.utc) + timedelta(days=1),
            )
            db.session.add(user)
            db.session.flush()
            session.user_id = user.id
            db.session.add(session)
            db.session.commit()
        return token

    def test_studio_routes_require_a_valid_session(self) -> None:
        response = self.client.get("/projects")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["code"], "UNAUTHORIZED")

    def test_cors_preflight_does_not_require_a_session(self) -> None:
        response = self.client.options(
            "/projects",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:3000",
        )

    def test_project_crud_and_ownership(self) -> None:
        created = self.client.post(
            "/projects",
            headers=self.headers,
            json={"id": "proj-one", "title": "First Chapter", "pages": [], "chapters": []},
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.get_json()["title"], "First Chapter")

        other_token = self._create_user("other@example.com")
        hidden = self.client.get(
            "/projects/proj-one",
            headers={"Authorization": f"Bearer {other_token}"},
        )
        self.assertEqual(hidden.status_code, 404)

        updated = self.client.patch(
            "/projects/proj-one",
            headers=self.headers,
            json={"id": "proj-one", "title": "Revised Chapter", "pages": [], "chapters": []},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["title"], "Revised Chapter")

        duplicate = self.client.post("/projects/proj-one/duplicate", headers=self.headers)
        self.assertEqual(duplicate.status_code, 201)
        self.assertEqual(duplicate.get_json()["title"], "Revised Chapter (Copy)")
        self.assertEqual(len(self.client.get("/projects", headers=self.headers).get_json()), 2)

        deleted = self.client.delete("/projects/proj-one", headers=self.headers)
        self.assertEqual(deleted.status_code, 204)

    def test_story_and_generation_scaffold_are_persisted(self) -> None:
        story = self.client.post(
            "/stories",
            headers=self.headers,
            json={
                "id": "story-one",
                "title": "The Quiet Bell",
                "genre": "Seinen",
                "logline": "A bell rings in an empty town.",
                "scriptExcerpt": "The rain starts.",
                "sceneCount": 1,
                "updatedAt": "2026-11-15T00:00:00Z",
            },
        )
        self.assertEqual(story.status_code, 201)
        self.assertEqual(self.client.get("/stories", headers=self.headers).get_json()[0]["title"], "The Quiet Bell")

        generated = self.client.post(
            "/generation/manga",
            headers=self.headers,
            json={
                "title": "Inkbound",
                "description": "A story about a wandering artist.",
                "genre": "Shonen",
                "artStyle": "Black-and-white manga",
                "characterName": "Mika",
                "characterRole": "Protagonist",
                "characterPersonality": "Curious",
                "characterHairstyle": "Short dark hair",
                "characterClothing": "Travel coat",
                "characterNotes": "",
                "storyContent": "A young artist discovers a hidden village.",
                "chaptersCount": 1,
                "pagesPerChapter": 2,
                "panelsPerPage": 3,
                "dialogueGeneration": True,
                "panelArtworkUrls": [],
            },
        )
        self.assertEqual(generated.status_code, 201)
        result = generated.get_json()
        self.assertEqual(len(result["project"]["pages"]), 2)
        self.assertEqual(result["character"]["name"], "Mika")
        self.assertEqual(len(self.client.get("/projects", headers=self.headers).get_json()), 1)
        self.assertEqual(len(self.client.get("/characters", headers=self.headers).get_json()), 1)

    def test_asset_upload_uses_private_storage_and_export_returns_download_url(self) -> None:
        with patch("backend.routes.studio_routes.upload_object") as storage_upload, patch(
            "backend.routes.studio_routes.signed_url",
            return_value="https://storage.example/signed-artifact",
        ):
            image_data = io.BytesIO()
            Image.new("RGB", (4, 4), "white").save(image_data, format="PNG")
            upload_response = self.client.post(
                "/assets",
                headers=self.headers,
                data={"file": (io.BytesIO(image_data.getvalue()), "panel.png")},
                content_type="multipart/form-data",
            )
            self.assertEqual(upload_response.status_code, 201)
            self.assertTrue(upload_response.get_json()["imageUrl"].startswith("https://"))
            storage_upload.assert_called_once()

            project = self.client.post(
                "/projects",
                headers=self.headers,
                json={
                    "id": "export-project",
                    "title": "Export Chapter",
                    "pages": [
                        {
                            "pageNumber": 1,
                            "chapterId": "chapter-1",
                            "backgroundColor": "#FFFFFF",
                            "elements": [],
                        }
                    ],
                    "chapters": [{"id": "chapter-1", "number": 1, "title": "Chapter 1"}],
                },
            )
            self.assertEqual(project.status_code, 201)
            settings = {
                "projectId": "export-project",
                "format": "PDF",
                "resolution": "150 DPI",
                "pageSize": "B5 Manga",
                "scope": "Complete Chapter",
                "quality": "Standard",
                "includeDialogue": True,
                "colorMode": "Grayscale",
            }
            with patch(
                "backend.routes.studio_routes.render_export",
                return_value=(b"%PDF-test", "application/pdf", "chapter.pdf"),
            ), patch("backend.routes.studio_routes.upload_object") as export_upload:
                exported = self.client.post("/exports", headers=self.headers, json=settings)
            self.assertEqual(exported.status_code, 201)
            self.assertEqual(exported.get_json()["status"], "Completed")
            self.assertEqual(
                exported.get_json()["downloadUrl"],
                "https://storage.example/signed-artifact",
            )
            export_upload.assert_called_once()

        with self.app.app_context():
            self.assertEqual(db.session.query(StudioAsset).count(), 1)
            self.assertEqual(db.session.query(StudioProject).count(), 1)
            self.assertEqual(db.session.query(StudioCharacter).count(), 0)
            self.assertEqual(db.session.query(StudioExport).count(), 1)


if __name__ == "__main__":
    unittest.main()
