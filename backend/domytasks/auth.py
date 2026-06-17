from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from domytasks.config import get_settings


def verify_bearer_token(authorization: str | None) -> bool:
    if not authorization:
        return False
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return False
    return parts[1] == get_settings().token


class BearerAuthMiddleware(BaseHTTPMiddleware):
    """Require bearer token on /api and /mcp routes."""

    PUBLIC_PREFIXES = ("/health",)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path.startswith(self.PUBLIC_PREFIXES):
            return await call_next(request)

        if path.startswith("/api") or path.startswith("/mcp"):
            if not verify_bearer_token(request.headers.get("authorization")):
                return JSONResponse({"detail": "Unauthorized"}, status_code=401)

        return await call_next(request)
