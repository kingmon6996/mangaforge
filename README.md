# MangaForge backend

The backend is a Flask JSON API for MangaForge authentication and studio data. It stores users, sessions, and studio records in PostgreSQL (configured for Supabase), sends authentication codes over SMTP, and uses Supabase Storage for uploaded artwork and rendered exports.

## Requirements

- Python 3.10 or newer
- A PostgreSQL database reachable by the backend (the project is configured for Supabase PostgreSQL)
- SMTP access for signup, login, and password recovery email
- Supabase Storage credentials and a private bucket for artwork and exports

## Configure

Create `backend\.env` (there is no checked-in `.env.example`) and set the following values:

| Variable | Required | Description |
| --- | --- | --- |
| `APP_SECRET_KEY` | Yes | Secret used to hash OTPs. Use a long, random value. |
| `SUPABASE_DB_HOST` | Yes | Supabase PostgreSQL host. |
| `SUPABASE_DB_USER` | Yes | Database username. |
| `SUPABASE_DB_PASSWORD` | Yes | Database password. |
| `SUPABASE_DB_NAME` | Yes | Database name. |
| `SUPABASE_DB_PORT` | No | Database port; defaults to `5432`. Connections use SSL (`sslmode=require`). |
| `SMTP_HOST` | Yes for email | SMTP server hostname. |
| `SMTP_FROM` | Yes for email | Sender address displayed on OTP email. |
| `SMTP_PORT` | No | SMTP port; defaults to `587`. |
| `SMTP_USER`, `SMTP_PASSWORD` | No | If either is set, both are required and used for SMTP login. |
| `SMTP_TIMEOUT_SECONDS` | No | SMTP timeout; defaults to `15`. |
| `SUPABASE_URL` | Yes for studio storage | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for studio storage | Server-only Storage credential; never expose it to the frontend. |
| `SUPABASE_STUDIO_BUCKET` | No | Private Storage bucket name; defaults to `mangaforge-studio`. |
| `FRONTEND_ORIGIN` | No | Single origin allowed by CORS and used for local frontend assets; defaults to `http://localhost:5173`. |
| `APP_HOST` | No | Bind address; defaults to `127.0.0.1`. |
| `APP_PORT` | No | Port; defaults to `5000`. |
| `FLASK_DEBUG` | No | Enable Flask debug mode when set to `1`, `true`, or `yes`; defaults to off. |

Keep `.env` out of source control. Create a **private** Supabase Storage bucket matching `SUPABASE_STUDIO_BUCKET` (or use the default name). Studio artwork and export downloads are served using signed URLs that expire after one hour.

## Install and run

From the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python -m backend.app
```

Or, from the `backend` directory:

```powershell
python -m pip install -r requirements.txt
python app.py
```

The API listens at `http://127.0.0.1:5000` by default. `GET /health` is a public health check and returns `{"status":"ok"}`. Set `VITE_API_BASE_URL=http://127.0.0.1:5000` in the frontend's local Vite environment to connect the frontend.

`create_app()` calls SQLAlchemy `db.create_all()` at startup. This creates missing tables for the current models, but does not update the columns of tables that already exist. For a database with an older `otp_verifications` table, apply [`migrations/001_auth_tables.sql`](./migrations/001_auth_tables.sql) to add the signup-related columns and verification-attempt count. [`migrations/003_studio_data.sql`](./migrations/003_studio_data.sql) creates the studio tables if you manage schema setup through SQL rather than relying on startup table creation. [`migrations/002_expired_auth_cleanup.sql`](./migrations/002_expired_auth_cleanup.sql) is optional: it requires the Supabase project to permit `pg_cron`, then schedules a database cleanup job every minute. Independently, expired OTPs, reset tokens, and sessions are deleted at the beginning of each `/auth` request.

## Authentication

Authentication endpoints are under `/auth`. Send JSON request bodies with `Content-Type: application/json`.

| Method and path | Request fields | Result |
| --- | --- | --- |
| `POST /auth/signup` | `name`, `email`, `password` | Starts signup by emailing an OTP. |
| `POST /auth/login/otp` | `email`, `password` | Checks the password, then emails a login OTP. |
| `POST /auth/forgot-password` | `email` | Starts password recovery. The response does not reveal whether the account exists. |
| `POST /auth/send-otp` | `email`, `purpose` (`signup`, `login`, or `reset`); signup also needs `name` and `password`, login needs `password` | Generic equivalent for requesting an OTP. |
| `POST /auth/verify-otp` | `email`, `otp`, `purpose` (`signup` or `login`) | Verifies the code and returns an access token and user data. |
| `POST /auth/verify-reset-otp` | `email`, `otp` | Verifies a recovery code and returns a short-lived reset token. |
| `POST /auth/reset-password` | `email`, `resetToken`, `newPassword` | Changes the password and revokes existing sessions. |
| `GET /auth/me` | Bearer access token | Returns the current user's data. |
| `POST /auth/logout` | Bearer access token | Revokes the current session; returns `204 No Content`. |

Signup and login use two requests: request the OTP, then send it to `/auth/verify-otp`. Password recovery uses `/auth/forgot-password`, `/auth/verify-reset-otp`, and then `/auth/reset-password`. Passwords must be at least eight characters and contain an uppercase letter, lowercase letter, number, and special character. OTPs expire after five minutes, permit up to five verification attempts, and can be resent after two minutes.

For example, after a successful verification, use the returned `accessToken` as a bearer token on authenticated requests:

```http
Authorization: Bearer <accessToken>
```

The raw session token is returned to the client; only its SHA-256 hash is stored in the database. Sessions expire after 30 days. New users receive the `Free` plan; subscription checkout and paid-plan entitlements are not implemented.

## Studio API

All studio routes require `Authorization: Bearer <accessToken>`. Records are scoped to their owner; another user's record is reported as not found.

| Method and path | Purpose |
| --- | --- |
| `GET`, `POST /projects` | List or create projects. |
| `GET`, `PATCH`, `DELETE /projects/<id>` | Read, replace/update, or delete an owned project. |
| `POST /projects/<id>/duplicate` | Duplicate an owned project. |
| `GET`, `POST /characters` | List or create characters. |
| `PATCH`, `DELETE /characters/<id>` | Update or delete an owned character. |
| `GET`, `POST /stories` | List or create stories. |
| `GET /templates` | Return the built-in panel templates. |
| `POST /generation/manga` | Create and save a form-based manga project and character scaffold; this is not AI generation. |
| `POST /generation/editor-action` | Returns `501 AI_PROVIDER_NOT_CONFIGURED`; no AI provider is currently implemented. |
| `GET /assets` | List the current user's artwork. |
| `POST /assets` | Upload a `file` as `multipart/form-data`. JPEG, PNG, and WebP images up to 20 MB are accepted. |
| `DELETE /assets/<id>` | Delete an owned artwork asset. |
| `GET`, `POST /exports` | List exports or render and store an export. |
| `GET /exports/<id>` | Get export details and its signed download URL, when available. |

Create requests for projects, characters, and stories use JSON and return the saved record. Project and character `PATCH` requests also use JSON and replace the saved payload; include the fields you want to keep. `POST /exports` requires `projectId`, `format` (`PDF`, `PNG`, or `JPEG`), `resolution` (`150 DPI`, `300 DPI`, or `600 DPI`), `pageSize` (`B5 Manga`, `A4 Editorial`, `US Tankobon`, or `Webtoon Vertical`), `scope` (`Single Page` or `Complete Chapter`), `quality` (`Standard` or `Print Master`), `colorMode` (`Grayscale` or `Color`), and boolean `includeDialogue`. Rendering happens during the request: the response is already `Completed` on success, rather than representing a background job. Multi-page PNG/JPEG exports are returned as a ZIP; PDF exports are PDF files.

## Tests

Run the unit tests from the repository root:

```powershell
python -m unittest discover -s backend/tests
```
