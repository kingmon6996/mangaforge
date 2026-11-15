import hashlib
import hmac
import logging
import re
import secrets
import smtplib
import ssl
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path

from flask import current_app, render_template
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db
from ..models import OtpVerification, User
from .errors import AuthError

logger = logging.getLogger(__name__)

PURPOSE_LABELS = {
    "signup": "sign up",
    "login": "sign in",
    "reset": "reset your password",
}
PASSWORD_PATTERN = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$")


def hash_otp(email: str, purpose: str, otp: str, secret: str) -> str:
    message = f"{email}:{purpose}:{otp}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def _send_email(recipient: str, purpose: str, otp: str) -> None:
    host = current_app.config.get("SMTP_HOST")
    sender = current_app.config.get("SMTP_FROM")
    if not host or not sender:
        raise AuthError(
            "Email delivery is not configured. Set SMTP_HOST and SMTP_FROM.",
            503,
            "SMTP_NOT_CONFIGURED",
        )

    message = EmailMessage()
    message["Subject"] = "Your MangaForge verification code"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        f"Your code to {PURPOSE_LABELS[purpose]} is {otp}. "
        f"It expires in {current_app.config['OTP_TTL_SECONDS'] // 60} minutes. "
        f"You can request a new code after {current_app.config['OTP_RESEND_SECONDS'] // 60} minutes."
    )
    message.add_alternative(
        render_template(
            "otp_email.html",
            otp=otp,
            purpose=PURPOSE_LABELS[purpose],
            expires_minutes=current_app.config["OTP_TTL_SECONDS"] // 60,
            resend_minutes=current_app.config["OTP_RESEND_SECONDS"] // 60,
        ),
        subtype="html",
    )
    html_part = message.get_body(preferencelist=("html",))
    if html_part is None:
        raise RuntimeError("The OTP HTML email body could not be created.")
    logo_path = Path(__file__).resolve().parents[1] / "public" / "logo.png"
    html_part.add_related(
        logo_path.read_bytes(),
        maintype="image",
        subtype="png",
        cid="<mangaforge-logo>",
    )

    try:
        with smtplib.SMTP(
            host,
            current_app.config["SMTP_PORT"],
            timeout=current_app.config["SMTP_TIMEOUT_SECONDS"],
        ) as server:
            server.starttls(context=ssl.create_default_context())
            username = current_app.config.get("SMTP_USER")
            password = current_app.config.get("SMTP_PASSWORD")
            if username or password:
                if not username or not password:
                    raise AuthError(
                        "Set both SMTP_USER and SMTP_PASSWORD to enable SMTP authentication.",
                        503,
                        "SMTP_NOT_CONFIGURED",
                    )
                server.login(username, password)
            server.send_message(message)
    except AuthError:
        raise
    except (OSError, smtplib.SMTPException):
        logger.exception("SMTP delivery failed for OTP request")
        raise AuthError(
            "Unable to deliver the verification email. Please try again later.",
            502,
            "SMTP_DELIVERY_FAILED",
        ) from None


def request_otp(
    email: str,
    purpose: str,
    *,
    name: str | None = None,
    password: str | None = None,
) -> dict[str, object]:
    now = datetime.now(timezone.utc)

    if purpose == "signup":
        if not isinstance(name, str) or len(name.strip()) < 2:
            raise AuthError("Please enter your name (at least 2 characters).", 400, "INVALID_NAME")
        if not isinstance(password, str) or not PASSWORD_PATTERN.fullmatch(password):
            raise AuthError(
                "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.",
                400,
                "WEAK_PASSWORD",
            )
        if db.session.execute(select(User.id).where(User.email == email)).scalar_one_or_none():
            raise AuthError("An account with this email already exists.", 409, "EMAIL_IN_USE")
    elif purpose == "login":
        user = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user or not isinstance(password, str) or not check_password_hash(user.password_hash, password):
            raise AuthError("Incorrect email or password.", 401, "INVALID_CREDENTIALS")
    elif purpose == "reset":
        user_exists = db.session.execute(select(User.id).where(User.email == email)).scalar_one_or_none()
        if not user_exists:
            return {
                "success": True,
                "message": "If an account exists for this email, a recovery code will be sent.",
                "expiresInSeconds": current_app.config["OTP_TTL_SECONDS"],
                "resendAvailableInSeconds": current_app.config["OTP_RESEND_SECONDS"],
            }

    try:
        latest = db.session.execute(
            select(OtpVerification)
            .where(
                OtpVerification.email == email,
                OtpVerification.purpose == purpose,
            )
            .order_by(OtpVerification.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()

        if latest:
            last_sent_at = latest.last_sent_at
            if last_sent_at.tzinfo is None:
                last_sent_at = last_sent_at.replace(tzinfo=timezone.utc)
            elapsed = (now - last_sent_at).total_seconds()
            if elapsed < current_app.config["OTP_RESEND_SECONDS"]:
                wait_seconds = current_app.config["OTP_RESEND_SECONDS"] - int(elapsed)
                raise AuthError(
                    f"Please wait {wait_seconds} seconds before requesting another code.",
                    429,
                    "OTP_RESEND_TOO_SOON",
                )
            db.session.delete(latest)

        otp = f"{secrets.randbelow(1_000_000):06d}"
        record = OtpVerification(
            email=email,
            purpose=purpose,
            code_hash=hash_otp(email, purpose, otp, current_app.config["SECRET_KEY"]),
            pending_name=name.strip() if purpose == "signup" and name else None,
            pending_password_hash=(
                generate_password_hash(password)
                if purpose == "signup" and password
                else None
            ),
            created_at=now,
            expires_at=now + timedelta(seconds=current_app.config["OTP_TTL_SECONDS"]),
            last_sent_at=now,
            attempts=0,
        )
        db.session.add(record)
        _send_email(email, purpose, otp)
        db.session.commit()
    except AuthError:
        db.session.rollback()
        raise
    except SQLAlchemyError:
        db.session.rollback()
        logger.exception("Could not store OTP request")
        raise AuthError(
            "Unable to record the verification request. Please try again later.",
            503,
            "DATABASE_UNAVAILABLE",
        ) from None

    return {
        "success": True,
        "message": f"Verification code sent to {email} via SMTP.",
        "expiresInSeconds": current_app.config["OTP_TTL_SECONDS"],
        "resendAvailableInSeconds": current_app.config["OTP_RESEND_SECONDS"],
    }
