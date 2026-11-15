import hashlib
import re
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from werkzeug.security import check_password_hash, generate_password_hash

from backend import create_app
from backend.extensions import db
from backend.handlers.errors import AuthError
from backend.handlers.otp_handler import hash_otp
from backend.models import OtpVerification, PasswordResetToken, User, UserSession


class AuthRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret",
                "SQLALCHEMY_DATABASE_URI": "sqlite://",
                "FRONTEND_ORIGIN": "http://localhost:3000",
                "SMTP_HOST": "smtp.example.com",
                "SMTP_PORT": 587,
                "SMTP_USER": "mailer@example.com",
                "SMTP_PASSWORD": "test-password",
                "SMTP_FROM": "mailer@example.com",
                "SMTP_TIMEOUT_SECONDS": 1,
            }
        )
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()

    def add_user(self, email: str = "user@example.com") -> User:
        user = User(
            email=email,
            name="Studio User",
            password_hash=generate_password_hash("StrongPass1!"),
        )
        db.session.add(user)
        db.session.commit()
        return user

    @patch("backend.handlers.otp_handler._send_email")
    def test_signup_verification_creates_user_and_persistent_session(self, send_email) -> None:
        request_response = self.client.post(
            "/auth/signup",
            json={
                "name": "Creator Name",
                "email": "Creator@example.com",
                "password": "StrongPass1!",
            },
        )
        self.assertEqual(request_response.status_code, 200)
        self.assertEqual(request_response.get_json()["expiresInSeconds"], 300)
        self.assertEqual(request_response.get_json()["resendAvailableInSeconds"], 120)
        send_email.assert_called_once()

        with self.app.app_context():
            otp_record = db.session.query(OtpVerification).one()
            self.assertEqual(otp_record.email, "creator@example.com")
            self.assertEqual(otp_record.pending_name, "Creator Name")
            self.assertTrue(check_password_hash(otp_record.pending_password_hash, "StrongPass1!"))
            otp = send_email.call_args.args[2]

        verify_response = self.client.post(
            "/auth/verify-otp",
            json={"email": "creator@example.com", "otp": otp, "purpose": "signup"},
        )
        self.assertEqual(verify_response.status_code, 200)
        session_response = verify_response.get_json()
        self.assertEqual(session_response["user"]["name"], "Creator Name")
        self.assertEqual(session_response["user"]["email"], "creator@example.com")
        self.assertEqual(session_response["user"]["plan"], "Free")
        access_token = session_response["accessToken"]

        with self.app.app_context():
            user = db.session.query(User).one()
            saved_session = db.session.query(UserSession).one()
            self.assertEqual(saved_session.user_id, user.id)
            self.assertEqual(saved_session.token_hash, hashlib.sha256(access_token.encode()).hexdigest())
            self.assertNotEqual(saved_session.token_hash, access_token)
            self.assertEqual(db.session.query(OtpVerification).count(), 0)

        me_response = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.get_json()["id"], session_response["user"]["id"])

        logout_response = self.client.post(
            "/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        self.assertEqual(logout_response.status_code, 204)
        self.assertEqual(
            self.client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {access_token}"},
            ).status_code,
            401,
        )

    @patch("backend.handlers.otp_handler._send_email")
    def test_login_requires_password_and_verification(self, send_email) -> None:
        with self.app.app_context():
            self.add_user()

        invalid = self.client.post(
            "/auth/login/otp",
            json={"email": "user@example.com", "password": "wrong"},
        )
        self.assertEqual(invalid.status_code, 401)
        send_email.assert_not_called()

        requested = self.client.post(
            "/auth/login/otp",
            json={"email": "user@example.com", "password": "StrongPass1!"},
        )
        self.assertEqual(requested.status_code, 200)
        verified = self.client.post(
            "/auth/verify-otp",
            json={
                "email": "user@example.com",
                "otp": send_email.call_args.args[2],
                "purpose": "login",
            },
        )
        self.assertEqual(verified.status_code, 200)
        self.assertTrue(verified.get_json()["accessToken"])

    @patch("backend.handlers.otp_handler._send_email")
    def test_resend_is_rate_limited(self, send_email) -> None:
        with self.app.app_context():
            self.add_user()

        first = self.client.post(
            "/auth/login/otp",
            json={"email": "user@example.com", "password": "StrongPass1!"},
        )
        second = self.client.post(
            "/auth/login/otp",
            json={"email": "user@example.com", "password": "StrongPass1!"},
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)
        self.assertEqual(second.get_json()["code"], "OTP_RESEND_TOO_SOON")
        send_email.assert_called_once()

    @patch(
        "backend.handlers.otp_handler._send_email",
        side_effect=AuthError("SMTP unavailable", 502, "SMTP_DELIVERY_FAILED"),
    )
    def test_smtp_failure_does_not_leave_an_active_otp(self, send_email) -> None:
        response = self.client.post(
            "/auth/signup",
            json={
                "name": "Creator",
                "email": "creator@example.com",
                "password": "StrongPass1!",
            },
        )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.get_json()["code"], "SMTP_DELIVERY_FAILED")
        send_email.assert_called_once()
        with self.app.app_context():
            self.assertEqual(db.session.query(OtpVerification).count(), 0)

    @patch("backend.handlers.otp_handler.smtplib.SMTP")
    def test_request_delivers_rendered_email_through_smtp(self, smtp_factory) -> None:
        smtp = smtp_factory.return_value.__enter__.return_value

        response = self.client.post(
            "/auth/signup",
            json={
                "name": "Creator",
                "email": "creator@example.com",
                "password": "StrongPass1!",
            },
        )

        self.assertEqual(response.status_code, 200)
        smtp_factory.assert_called_once_with("smtp.example.com", 587, timeout=1)
        smtp.starttls.assert_called_once()
        smtp.login.assert_called_once_with("mailer@example.com", "test-password")
        message = smtp.send_message.call_args.args[0]
        self.assertEqual(message["To"], "creator@example.com")
        self.assertTrue(message.is_multipart())
        plain_body = message.get_body(preferencelist=("plain",)).get_content()
        html_part = next(part for part in message.walk() if part.get_content_type() == "text/html")
        html_body = html_part.get_content()
        otp = re.search(r"\b\d{6}\b", plain_body)
        self.assertIsNotNone(otp)
        self.assertIn(otp.group(), html_body)
        self.assertIn("expires in 5 minutes", plain_body)
        self.assertIn("expires in 5 minutes", html_body)
        self.assertIn("new code after 2 minutes", plain_body)
        self.assertIn("new code after <strong>2 minutes</strong>", html_body)
        self.assertIn("cid:mangaforge-logo", html_body)
        logo_part = next(part for part in message.walk() if part.get_content_type() == "image/png")
        self.assertEqual(logo_part["Content-ID"], "<mangaforge-logo>")
        self.assertEqual(logo_part.get_content_disposition(), "inline")
        self.assertIsNone(logo_part.get_filename())
        self.assertFalse(logo_part.is_attachment())
        related_part = next(
            part for part in message.walk() if part.get_content_type() == "multipart/related"
        )
        self.assertIs(related_part.get_body(preferencelist=("html",)), html_part)
        with self.app.app_context():
            saved = db.session.query(OtpVerification).one()
            self.assertEqual(
                saved.code_hash,
                hash_otp("creator@example.com", "signup", otp.group(), "test-secret"),
            )

    @patch("backend.handlers.otp_handler._send_email")
    def test_reset_verification_consumes_otp_and_token_resets_password(self, send_email) -> None:
        with self.app.app_context():
            user = self.add_user()
            user_id = user.id
            db.session.add(
                UserSession(
                    token_hash="a" * 64,
                    user_id=user.id,
                    expires_at=datetime.now(timezone.utc) + timedelta(days=1),
                )
            )
            db.session.commit()

        requested = self.client.post(
            "/auth/forgot-password",
            json={"email": "user@example.com"},
        )
        self.assertEqual(requested.status_code, 200)
        verified = self.client.post(
            "/auth/verify-reset-otp",
            json={
                "email": "user@example.com",
                "otp": send_email.call_args.args[2],
            },
        )
        self.assertEqual(verified.status_code, 200)
        reset_token = verified.get_json()["resetToken"]
        with self.app.app_context():
            self.assertEqual(db.session.query(OtpVerification).count(), 0)
            self.assertEqual(db.session.query(PasswordResetToken).count(), 1)

        reset = self.client.post(
            "/auth/reset-password",
            json={
                "email": "user@example.com",
                "resetToken": reset_token,
                "newPassword": "NewStrong2!",
            },
        )
        self.assertEqual(reset.status_code, 200)
        with self.app.app_context():
            user = db.session.get(User, user_id)
            self.assertTrue(check_password_hash(user.password_hash, "NewStrong2!"))
            self.assertEqual(db.session.query(PasswordResetToken).count(), 0)
            self.assertEqual(db.session.query(UserSession).count(), 0)

    def test_expired_otp_is_removed_and_cannot_be_used(self) -> None:
        with self.app.app_context():
            user = self.add_user()
            expired_at = datetime.now(timezone.utc) - timedelta(minutes=1)
            db.session.add(
                OtpVerification(
                    email="user@example.com",
                    purpose="signup",
                    code_hash=hash_otp("user@example.com", "signup", "123456", "test-secret"),
                    pending_name="Creator",
                    pending_password_hash=generate_password_hash("StrongPass1!"),
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=11),
                    expires_at=expired_at,
                    last_sent_at=datetime.now(timezone.utc) - timedelta(minutes=11),
                )
            )
            db.session.add(
                UserSession(
                    token_hash="c" * 64,
                    user_id=user.id,
                    expires_at=expired_at,
                )
            )
            db.session.add(
                PasswordResetToken(
                    token_hash="d" * 64,
                    user_id=user.id,
                    expires_at=expired_at,
                )
            )
            db.session.commit()

        response = self.client.post(
            "/auth/verify-otp",
            json={"email": "user@example.com", "otp": "123456", "purpose": "signup"},
        )

        self.assertEqual(response.status_code, 410)
        self.assertEqual(response.get_json()["code"], "OTP_EXPIRED")
        with self.app.app_context():
            self.assertEqual(db.session.query(OtpVerification).count(), 0)
            self.assertEqual(db.session.query(UserSession).count(), 0)
            self.assertEqual(db.session.query(PasswordResetToken).count(), 0)

    def test_rejects_invalid_email(self) -> None:
        response = self.client.post(
            "/auth/send-otp",
            json={"email": "not-an-email", "purpose": "signup"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["code"], "INVALID_EMAIL")


if __name__ == "__main__":
    unittest.main()
