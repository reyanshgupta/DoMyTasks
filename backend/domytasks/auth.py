import base64
import hashlib
import hmac
import ipaddress
import json
import time
from typing import Literal

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from domytasks.config import get_settings

AuthMethod = Literal["bearer", "session", "authelia"]


def _split_csv(value: str | None) -> set[str]:
    if not value:
        return set()
    return {item.strip() for item in value.split(",") if item.strip()}


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")


def _session_signature(payload: str) -> str:
    token = get_settings().token.encode("utf-8")
    digest = hmac.new(token, payload.encode("ascii"), hashlib.sha256).digest()
    return _b64encode(digest)


def verify_bearer_token(authorization: str | None) -> bool:
    token = extract_bearer_token(authorization)
    if not token:
        return False
    return verify_token_value(token)


def extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


def verify_token_value(token: str | None) -> bool:
    if token is None:
        return False
    return hmac.compare_digest(token, get_settings().token)


def create_web_session_cookie_value(now: int | None = None) -> str:
    issued_at = int(now if now is not None else time.time())
    payload = _b64encode(
        json.dumps({"v": 1, "iat": issued_at}, separators=(",", ":")).encode(
            "utf-8"
        )
    )
    return f"{payload}.{_session_signature(payload)}"


def verify_web_session_cookie(value: str | None, now: int | None = None) -> bool:
    if not value or "." not in value:
        return False
    payload, signature = value.rsplit(".", 1)
    if not hmac.compare_digest(signature, _session_signature(payload)):
        return False

    try:
        data = json.loads(_b64decode(payload))
        issued_at = int(data["iat"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return False

    settings = get_settings()
    current = int(now if now is not None else time.time())
    max_age = settings.web_session_days * 24 * 60 * 60
    return issued_at <= current + 300 and current - issued_at <= max_age


def set_web_session_cookie(response: Response) -> None:
    settings = get_settings()
    max_age = settings.web_session_days * 24 * 60 * 60
    response.set_cookie(
        settings.web_session_cookie_name,
        create_web_session_cookie_value(),
        max_age=max_age,
        httponly=True,
        secure=settings.web_session_secure,
        samesite="lax",
        path="/",
    )


def clear_web_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(settings.web_session_cookie_name, path="/")


def _client_is_trusted_proxy(request: Request) -> bool:
    trusted_proxies = _split_csv(get_settings().authelia_trusted_proxies)
    if "*" in trusted_proxies:
        return True
    if not request.client or not request.client.host or not trusted_proxies:
        return False

    try:
        client_ip = ipaddress.ip_address(request.client.host)
    except ValueError:
        return False

    for proxy in trusted_proxies:
        try:
            if client_ip in ipaddress.ip_network(proxy, strict=False):
                return True
        except ValueError:
            continue
    return False


def authelia_user(request: Request) -> str | None:
    settings = get_settings()
    if not settings.authelia_enabled or not _client_is_trusted_proxy(request):
        return None

    user = request.headers.get(settings.authelia_user_header)
    if not user:
        return None

    allowed_users = _split_csv(settings.authelia_allowed_users)
    if allowed_users and user not in allowed_users:
        return None

    allowed_groups = _split_csv(settings.authelia_allowed_groups)
    if allowed_groups:
        groups = _split_csv(request.headers.get(settings.authelia_groups_header))
        if not groups.intersection(allowed_groups):
            return None

    return user


def auth_method_for_request(
    request: Request,
    include_session: bool = True,
) -> AuthMethod | None:
    if verify_bearer_token(request.headers.get("authorization")):
        return "bearer"

    if include_session:
        cookie_name = get_settings().web_session_cookie_name
        if verify_web_session_cookie(request.cookies.get(cookie_name)):
            return "session"

    if include_session and authelia_user(request):
        return "authelia"

    return None


class BearerAuthMiddleware(BaseHTTPMiddleware):
    """Require auth on API and MCP routes."""

    PUBLIC_PREFIXES = ("/health", "/api/auth/")

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path.startswith(self.PUBLIC_PREFIXES):
            return await call_next(request)

        if path.startswith("/mcp"):
            if not auth_method_for_request(request, include_session=False):
                return JSONResponse({"detail": "Unauthorized"}, status_code=401)

        if path.startswith("/api"):
            if not auth_method_for_request(request):
                return JSONResponse({"detail": "Unauthorized"}, status_code=401)

        return await call_next(request)
