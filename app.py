import sys
from pathlib import Path
from typing import Any

from flask import Flask
from flask_cors import CORS
from sqlalchemy.exc import SQLAlchemyError

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    __package__ = "backend"

from .config import Config
from .extensions import db
from .routes.auth_routes import auth_routes
from .routes.studio_routes import studio_routes


def create_app(config_overrides: dict[str, Any] | None = None) -> Flask:
    app = Flask(__name__, template_folder="templates")
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)
    app.config.setdefault(
        "MAX_CONTENT_LENGTH",
        app.config["UPLOAD_MAX_BYTES"] + 1024 * 1024,
    )

    if not app.config.get("SECRET_KEY"):
        raise RuntimeError("APP_SECRET_KEY is required. Set it in backend/.env.")
    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        raise RuntimeError("Supabase database settings are required. Set them in backend/.env.")

    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": app.config["FRONTEND_ORIGIN"]}})
    app.register_blueprint(auth_routes, url_prefix="/auth")
    app.register_blueprint(studio_routes)

    with app.app_context():
        db.create_all()

    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(_error: SQLAlchemyError):
        db.session.rollback()
        app.logger.exception("Database request failed")
        return {
            "success": False,
            "code": "DATABASE_UNAVAILABLE",
            "message": "A database error prevented the request from completing.",
        }, 503

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(
        host=application.config["APP_HOST"],
        port=application.config["APP_PORT"],
        debug=application.config["FLASK_DEBUG"],
    )
