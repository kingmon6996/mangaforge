import json
import logging
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen

from flask import current_app

logger = logging.getLogger(__name__)


class StorageError(RuntimeError):
    pass


def _settings() -> tuple[str, str, str]:
    base_url = (current_app.config.get("SUPABASE_URL") or "").rstrip("/")
    service_key = current_app.config.get("SUPABASE_SERVICE_ROLE_KEY")
    bucket = current_app.config.get("SUPABASE_STUDIO_BUCKET")
    if not base_url or not service_key or not bucket:
        raise StorageError(
            "Supabase Storage is not configured. Set SUPABASE_URL, "
            "SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STUDIO_BUCKET."
        )
    return base_url, service_key, bucket


def _request(
    method: str,
    endpoint: str,
    *,
    body: bytes | None = None,
    content_type: str | None = None,
) -> bytes:
    base_url, service_key, _ = _settings()
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }
    if content_type:
        headers["Content-Type"] = content_type
    request = Request(
        f"{base_url}/storage/v1/{endpoint.lstrip('/')}",
        data=body,
        headers=headers,
        method=method,
    )
    try:
        with urlopen(request, timeout=30) as response:
            return response.read()
    except (HTTPError, URLError, TimeoutError, OSError):
        logger.exception("Supabase Storage request failed")
        raise StorageError("Supabase Storage request failed.") from None


def upload_object(path: str, data: bytes, content_type: str) -> None:
    _, _, bucket = _settings()
    encoded_path = quote(f"{bucket}/{path}", safe="/")
    _request(
        "POST",
        f"object/{encoded_path}",
        body=data,
        content_type=content_type,
    )


def signed_url(path: str, download_filename: str | None = None) -> str:
    base_url, _, bucket = _settings()
    encoded_path = quote(f"{bucket}/{path}", safe="/")
    options: dict[str, int | bool] = {
        "expiresIn": current_app.config["STORAGE_SIGNED_URL_TTL_SECONDS"]
    }
    if download_filename:
        options["download"] = True
    response = _request(
        "POST",
        f"object/sign/{encoded_path}",
        body=json.dumps(options).encode("utf-8"),
        content_type="application/json",
    )
    try:
        result = json.loads(response)
    except json.JSONDecodeError:
        logger.exception("Supabase Storage returned an invalid signed URL response")
        raise StorageError("Supabase Storage returned an invalid response.") from None
    signed = result.get("signedURL") or result.get("signedUrl")
    if not isinstance(signed, str) or not signed:
        raise StorageError("Supabase Storage did not return a signed URL.")
    if signed.startswith("http://") or signed.startswith("https://"):
        return signed
    if signed.startswith("/storage/v1/"):
        return f"{base_url}{signed}"
    if signed.startswith("/"):
        return f"{base_url}/storage/v1{signed}"
    return f"{base_url}/storage/v1/{signed}"


def download_object(path: str) -> bytes:
    _, _, bucket = _settings()
    encoded_path = quote(f"{bucket}/{path}", safe="/")
    return _request("GET", f"object/authenticated/{encoded_path}")


def delete_object(path: str) -> None:
    _, _, bucket = _settings()
    encoded_bucket = quote(bucket, safe="")
    _request(
        "DELETE",
        f"object/{encoded_bucket}",
        body=json.dumps({"prefixes": [path]}).encode("utf-8"),
        content_type="application/json",
    )


def storage_path_from_url(value: str) -> str | None:
    if value.startswith("storage://"):
        return value.removeprefix("storage://")

    parsed = urlsplit(value)
    marker = "/storage/v1/object/"
    marker_index = parsed.path.find(marker)
    if marker_index < 0:
        return None

    _, _, bucket = _settings()
    object_parts = parsed.path[marker_index + len(marker) :].split("/")
    if len(object_parts) < 3 or object_parts[1] != bucket:
        return None
    if object_parts[0] not in {"sign", "public", "authenticated"}:
        return None
    return unquote("/".join(object_parts[2:]))


def storage_reference(path: str) -> str:
    return f"storage://{path}"


def hydrate_storage_references(value):
    if isinstance(value, dict):
        return {key: hydrate_storage_references(item) for key, item in value.items()}
    if isinstance(value, list):
        return [hydrate_storage_references(item) for item in value]
    if isinstance(value, str) and value.startswith("storage://"):
        return signed_url(value.removeprefix("storage://"))
    return value


def normalize_storage_urls(value):
    if isinstance(value, dict):
        return {key: normalize_storage_urls(item) for key, item in value.items()}
    if isinstance(value, list):
        return [normalize_storage_urls(item) for item in value]
    if isinstance(value, str):
        path = storage_path_from_url(value)
        if path:
            return storage_reference(path)
    return value
