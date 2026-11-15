from datetime import datetime, timezone

from ..extensions import db


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    token_hash = db.Column(db.String(64), primary_key=True)
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
