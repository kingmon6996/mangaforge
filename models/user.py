import uuid
from datetime import datetime, timezone

from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(320), nullable=False, unique=True, index=True)
    name = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    plan = db.Column(db.String(20), nullable=False, default="Free")
    monthly_pages_used = db.Column(db.Integer, nullable=False, default=0)
    monthly_pages_limit = db.Column(db.Integer, nullable=False, default=10)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
