import uuid
from datetime import datetime, timezone

from ..extensions import db


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4()}"


def _now() -> datetime:
    return datetime.now(timezone.utc)


class StudioProject(db.Model):
    __tablename__ = "studio_projects"

    id = db.Column(db.String(80), primary_key=True, default=lambda: _new_id("proj"))
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = db.Column(db.String(200), nullable=False)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_now)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)


class StudioCharacter(db.Model):
    __tablename__ = "studio_characters"

    id = db.Column(db.String(80), primary_key=True, default=lambda: _new_id("char"))
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(200), nullable=False)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_now)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)


class StudioStory(db.Model):
    __tablename__ = "studio_stories"

    id = db.Column(db.String(80), primary_key=True, default=lambda: _new_id("story"))
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = db.Column(db.String(200), nullable=False)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_now)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)


class StudioAsset(db.Model):
    __tablename__ = "studio_assets"

    id = db.Column(db.String(80), primary_key=True, default=lambda: _new_id("asset"))
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(40), nullable=False, default="Uploaded")
    media_type = db.Column(db.String(100), nullable=False)
    storage_path = db.Column(db.String(512), nullable=False, unique=True)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_now)


class StudioExport(db.Model):
    __tablename__ = "studio_exports"

    id = db.Column(db.String(80), primary_key=True, default=lambda: _new_id("export"))
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id = db.Column(db.String(80), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="Queued")
    progress = db.Column(db.Integer, nullable=False, default=0)
    artifact_path = db.Column(db.String(512), nullable=True)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_now)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)
