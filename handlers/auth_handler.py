import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from flask import current_app, request
from sqlalchemy import delete, select
from werkzeug.security import generate_password_hash

from ..extensions import db
from ..models import OtpVerification, PasswordResetToken, User, UserSession
from .errors import AuthError
from .otp_handler import PASSWORD_PATTERN, hash_otp


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def _new_session(user: User) -> dict[str, Any]:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=current_app.config["SESSION_TTL_SECONDS"]
    )
    session = UserSession(
        token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest(),
        user_id=user.id,
        expires_at=expires_at,
    )
    db.session.add(session)
    return {
        "accessToken": token,
        "expiresAt": expires_at.isoformat(),
        "user": user_payload(user),
    }


def user_payload(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "plan": user.plan,
        "monthlyPagesUsed": user.monthly_pages_used,
        "monthlyPagesLimit": user.monthly_pages_limit,
        "createdAt": user.created_at.isoformat(),
    }


def verify_otp(email: str, purpose: str, otp: str) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    record = db.session.execute(
        select(OtpVerification)
        .where(
            OtpVerification.email == email,
            OtpVerification.purpose == purpose,
        )
        .order_by(OtpVerification.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if not record or _utc(record.expires_at) <= now:
        if record:
            db.session.delete(record)
            db.session.commit()
        raise AuthError("This verification code has expired. Request a new code.", 410, "OTP_EXPIRED")

    submitted_hash = hash_otp(email, purpose, otp, current_app.config["SECRET_KEY"])
    if not hmac.compare_digest(record.code_hash, submitted_hash):
        record.attempts += 1
        if record.attempts >= current_app.config["OTP_MAX_ATTEMPTS"]:
            db.session.delete(record)
        db.session.commit()
        raise AuthError("Invalid verification code.", 401, "INVALID_OTP")

    db.session.delete(record)
    if purpose == "signup":
        if not record.pending_name or not record.pending_password_hash:
            db.session.commit()
            raise AuthError("Signup request expired. Please start again.", 410, "OTP_EXPIRED")
        user = User(
            email=email,
            name=record.pending_name,
            password_hash=record.pending_password_hash,
        )
        db.session.add(user)
        db.session.flush()
        response = _new_session(user)
    elif purpose == "login":
        user = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user:
            db.session.commit()
            raise AuthError("This account no longer exists.", 401, "ACCOUNT_NOT_FOUND")
        response = _new_session(user)
    elif purpose == "reset":
        user = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user:
            db.session.commit()
            raise AuthError("This account no longer exists.", 401, "ACCOUNT_NOT_FOUND")
        token = secrets.token_urlsafe(32)
        db.session.add(
            PasswordResetToken(
                token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest(),
                user_id=user.id,
                expires_at=now + timedelta(seconds=current_app.config["OTP_TTL_SECONDS"]),
            )
        )
        response = {"verified": True, "resetToken": token}
    else:
        db.session.rollback()
        raise AuthError("Unsupported verification purpose.", 400, "INVALID_PURPOSE")

    db.session.commit()
    return response


def reset_password(email: str, reset_token: str, new_password: str) -> dict[str, Any]:
    if not PASSWORD_PATTERN.fullmatch(new_password):
        raise AuthError(
            "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.",
            400,
            "WEAK_PASSWORD",
        )

    token_hash = hashlib.sha256(reset_token.encode("utf-8")).hexdigest()
    reset_record = db.session.execute(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    ).scalar_one_or_none()
    if not reset_record or _utc(reset_record.expires_at) <= datetime.now(timezone.utc):
        if reset_record:
            db.session.delete(reset_record)
            db.session.commit()
        raise AuthError("Password reset session expired. Request a fresh code.", 401, "RESET_REQUIRED")

    user = db.session.get(User, reset_record.user_id)
    if not user or user.email != email:
        raise AuthError("Invalid password reset session.", 401, "RESET_REQUIRED")

    user.password_hash = generate_password_hash(new_password)
    user.updated_at = datetime.now(timezone.utc)
    db.session.delete(reset_record)
    db.session.execute(delete(UserSession).where(UserSession.user_id == user.id))
    db.session.commit()
    return {
        "success": True,
        "message": "Your password has been updated. Sign in with your new password.",
    }


def authenticated_user() -> User | None:
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    session = db.session.execute(
        select(UserSession).where(UserSession.token_hash == token_hash)
    ).scalar_one_or_none()
    if not session:
        return None
    if _utc(session.expires_at) <= datetime.now(timezone.utc):
        db.session.delete(session)
        db.session.commit()
        return None
    return session.user


def logout_session() -> None:
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    session = db.session.get(UserSession, token_hash)
    if session:
        db.session.delete(session)
        db.session.commit()
