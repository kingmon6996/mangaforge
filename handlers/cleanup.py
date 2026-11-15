from datetime import datetime, timezone

from sqlalchemy import delete

from ..extensions import db
from ..models import OtpVerification, PasswordResetToken, UserSession


def cleanup_expired_records() -> None:
    now = datetime.now(timezone.utc)
    db.session.execute(delete(OtpVerification).where(OtpVerification.expires_at <= now))
    db.session.execute(delete(PasswordResetToken).where(PasswordResetToken.expires_at <= now))
    db.session.execute(delete(UserSession).where(UserSession.expires_at <= now))
    db.session.commit()
