from datetime import datetime, timezone

from ..extensions import db


class OtpVerification(db.Model):
    __tablename__ = "otp_verifications"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(320), nullable=False, index=True)
    purpose = db.Column(db.String(20), nullable=False)
    code_hash = db.Column(db.String(64), nullable=False)
    pending_name = db.Column(db.String(120))
    pending_password_hash = db.Column(db.String(255))
    attempts = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    last_sent_at = db.Column(db.DateTime(timezone=True), nullable=False)
    is_used = db.Column(db.Boolean, nullable=False, default=False)

    __table_args__ = (
        db.Index("ix_otp_verifications_email_purpose", "email", "purpose"),
        db.Index("ix_otp_verifications_expires_at", "expires_at"),
    )
