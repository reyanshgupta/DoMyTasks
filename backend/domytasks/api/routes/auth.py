from fastapi import APIRouter, HTTPException, Request, Response

from domytasks.auth import (
    auth_method_for_request,
    authelia_user,
    clear_web_session_cookie,
    set_web_session_cookie,
    verify_token_value,
)
from domytasks.config import get_settings
from domytasks.schemas import AuthLogin, AuthSession

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/session", response_model=AuthSession)
def get_auth_session(request: Request):
    settings = get_settings()
    method = auth_method_for_request(request)
    if not method:
        return AuthSession(
            authenticated=False,
            authelia_enabled=settings.authelia_enabled,
        )

    return AuthSession(
        authenticated=True,
        method=method,
        user=authelia_user(request) if method == "authelia" else None,
        authelia_enabled=settings.authelia_enabled,
    )


@router.post("/login", response_model=AuthSession)
def login(body: AuthLogin, response: Response):
    if not verify_token_value(body.token.strip()):
        raise HTTPException(status_code=401, detail="Invalid token")

    set_web_session_cookie(response)
    return AuthSession(
        authenticated=True,
        method="session",
        authelia_enabled=get_settings().authelia_enabled,
    )


@router.post("/logout", response_model=AuthSession)
def logout(response: Response):
    clear_web_session_cookie(response)
    return AuthSession(
        authenticated=False,
        authelia_enabled=get_settings().authelia_enabled,
    )
