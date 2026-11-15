import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import URL

load_dotenv(Path(__file__).with_name(".env"))


def _database_url() -> str | None:
    host = os.getenv("SUPABASE_DB_HOST")
    if not host:
        return None

    required = {
        "SUPABASE_DB_USER": os.getenv("SUPABASE_DB_USER"),
        "SUPABASE_DB_PASSWORD": os.getenv("SUPABASE_DB_PASSWORD"),
        "SUPABASE_DB_NAME": os.getenv("SUPABASE_DB_NAME"),
    }
    missing = [key for key, value in required.items() if not value]
    if missing:
        raise RuntimeError(f"Missing Supabase database settings: {', '.join(missing)}")

    return URL.create(
        drivername="postgresql+psycopg",
        username=required["SUPABASE_DB_USER"],
        password=required["SUPABASE_DB_PASSWORD"],
        host=host,
        port=int(os.getenv("SUPABASE_DB_PORT", "5432")),
        database=required["SUPABASE_DB_NAME"],
        query={"sslmode": "require"},
    ).render_as_string(hide_password=False)


class Config:
    SECRET_KEY = os.getenv("APP_SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    APP_HOST = os.getenv("APP_HOST", "127.0.0.1")
    APP_PORT = int(os.getenv("APP_PORT", "5000"))
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "0").lower() in {"1", "true", "yes"}
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_FROM = os.getenv("SMTP_FROM")
    SMTP_TIMEOUT_SECONDS = int(os.getenv("SMTP_TIMEOUT_SECONDS", "15"))

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_PROFILE_BUCKET = os.getenv("SUPABASE_PROFILE_BUCKET")
    SUPABASE_STUDIO_BUCKET = os.getenv("SUPABASE_STUDIO_BUCKET", "mangaforge-studio")
    STORAGE_SIGNED_URL_TTL_SECONDS = 60 * 60
    UPLOAD_MAX_BYTES = 20 * 1024 * 1024

    OTP_TTL_SECONDS = 5 * 60
    OTP_RESEND_SECONDS = 2 * 60
    OTP_MAX_ATTEMPTS = 5
    SESSION_TTL_SECONDS = 30 * 24 * 60 * 60
