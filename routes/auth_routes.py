import re
from typing import Any

from flask import Blueprint, jsonify, request

from ..handlers.auth_handler import (
    authenticated_user,
    logout_session,
    reset_password,
    user_payload,
    verify_otp,
)
from ..handlers.cleanup import cleanup_expired_records
from ..handlers.errors import AuthError
from ..handlers.otp_handler import request_otp

auth_routes = Blueprint("auth", __name__)
VALID_PURPOSES = {"signup", "login", "reset"}
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
OTP_PATTERN = re.compile(r"^\d{6}$")


@auth_routes.before_request
def cleanup_expired_auth_records() -> None:
    cleanup_expired_records()


def _json_body() -> dict[str, Any]:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise AuthError("A JSON request body is required.", 400, "INVALID_REQUEST")
    return payload


def _email(payload: dict[str, Any]) -> str:
    email = payload.get("email")
    if not isinstance(email, str) or not EMAIL_PATTERN.fullmatch(email.strip()):
        raise AuthError("Enter a valid email address.", 400, "INVALID_EMAIL")
    return email.strip().lower()


def _handle_error(error: AuthError):
    return jsonify({"success": False, "code": error.code, "message": str(error)}), error.status_code


@auth_routes.post("/send-otp")
def send_otp():
    try:
        payload = _json_body()
        email = _email(payload)
        purpose = payload.get("purpose")
        if not isinstance(purpose, str) or purpose not in VALID_PURPOSES:
            raise AuthError(
                "Purpose must be signup, login, or reset.",
                400,
                "INVALID_PURPOSE",
            )
        response = request_otp(
            email,
            purpose,
            name=payload.get("name"),
            password=payload.get("password"),
        )
        return jsonify(response)
    except AuthError as error:
        return _handle_error(error)


@auth_routes.post("/signup")
def signup_otp():
    try:
        payload = _json_body()
        response = request_otp(
            _email(payload),
            "signup",
            name=payload.get("name"),
            password=payload.get("password"),
        )
        return jsonify(response)
    except AuthError as error:
        return _handle_error(error)


@auth_routes.post("/login/otp")
def login_otp():
    try:
        payload = _json_body()
        response = request_otp(
            _email(payload),
            "login",
            password=payload.get("password"),
        )
        return jsonify(response)
    except AuthError as error:
        return _handle_error(error)


@auth_routes.post("/forgot-password")
def reset_otp():
    try:
        response = request_otp(_email(_json_body()), "reset")
        return jsonify(response)
    except AuthError as error:
        return _handle_error(error)


@auth_routes.post("/verify-otp")
def verify_auth_otp():
    try:
        payload = _json_body()
        email = _email(payload)
        purpose = payload.get("purpose")
        otp = payload.get("otp")
        if not isinstance(purpose, str) or purpose not in {"signup", "login"}:
            raise AuthError("Purpose must be signup or login.", 400, "INVALID_PURPOSE")
        if not isinstance(otp, str) or not OTP_PATTERN.fullmatch(otp.strip()):
            raise AuthError("Enter the 6-digit verification code.", 400, "INVALID_OTP")
        return jsonify(verify_otp(email, purpose, otp.strip()))
    except AuthError as error:
        return _handle_error(error)


@auth_routes.post("/verify-reset-otp")
def verify_reset_otp():
    try:
        payload = _json_body()
        email = _email(payload)
        otp = payload.get("otp")
        if not isinstance(otp, str) or not OTP_PATTERN.fullmatch(otp.strip()):
            raise AuthError("Enter the 6-digit verification code.", 400, "INVALID_OTP")
        return jsonify(verify_otp(email, "reset", otp.strip()))
    except AuthError as error:
        return _handle_error(error)


@auth_routes.post("/reset-password")
def reset_account_password():
    try:
        payload = _json_body()
        reset_token = payload.get("resetToken")
        new_password = payload.get("newPassword")
        if not isinstance(reset_token, str) or not isinstance(new_password, str):
            raise AuthError("A reset token and new password are required.", 400, "INVALID_REQUEST")
        response = reset_password(
            _email(payload),
            reset_token,
            new_password,
        )
        return jsonify(response)
    except AuthError as error:
        return _handle_error(error)


@auth_routes.get("/me")
def get_current_user():
    user = authenticated_user()
    if not user:
        return (
            jsonify(
                {
                    "success": False,
                    "code": "UNAUTHORIZED",
                    "message": "Session expired. Please sign in again.",
                }
            ),
            401,
        )
    return jsonify(user_payload(user))


@auth_routes.post("/logout")
def logout():
    logout_session()
    return "", 204
