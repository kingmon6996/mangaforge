from typing import Any

from flask import Flask


def create_app(config_overrides: dict[str, Any] | None = None) -> Flask:
    from .app import create_app as app_factory

    return app_factory(config_overrides)


__all__ = ["create_app"]
