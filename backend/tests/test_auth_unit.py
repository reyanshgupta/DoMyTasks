import os
import time
from pathlib import Path

import pytest
from starlette.requests import Request

from domytasks.auth import (
    authelia_user,
    create_web_session_cookie_value,
    extract_bearer_token,
    verify_bearer_token,
    verify_token_value,
    verify_web_session_cookie,
)
from domytasks.config import get_settings


@pytest.fixture(autouse=True)
def auth_settings(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("DOMYTASKS_TOKEN", "secret-token")
    monkeypatch.setenv("DOMYTASKS_DB_PATH", str(tmp_path / "auth.db"))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_extract_bearer_token():
    assert extract_bearer_token("Bearer abc") == "abc"
    assert extract_bearer_token("bearer abc") == "abc"
    assert extract_bearer_token("Basic abc") is None
    assert extract_bearer_token(None) is None
    assert extract_bearer_token("Bearer") is None


def test_verify_bearer_token():
    assert verify_bearer_token("Bearer secret-token") is True
    assert verify_bearer_token("Bearer wrong") is False
    assert verify_token_value("secret-token") is True
    assert verify_token_value(None) is False


def test_session_cookie_round_trip():
    now = 1_700_000_000
    cookie = create_web_session_cookie_value(now=now)
    assert verify_web_session_cookie(cookie, now=now) is True


def test_session_cookie_rejects_tampered_signature():
    now = 1_700_000_000
    cookie = create_web_session_cookie_value(now=now)
    payload, _sig = cookie.rsplit(".", 1)
    assert verify_web_session_cookie(f"{payload}.bad-signature", now=now) is False


def test_session_cookie_rejects_expired():
    now = 1_700_000_000
    cookie = create_web_session_cookie_value(now=now)
    settings = get_settings()
    max_age = settings.web_session_days * 24 * 60 * 60
    assert verify_web_session_cookie(cookie, now=now + max_age + 1) is False


def test_session_cookie_rejects_future_issued_at():
    now = 1_700_000_000
    cookie = create_web_session_cookie_value(now=now + 400)
    assert verify_web_session_cookie(cookie, now=now) is False


def _request(headers: dict | None = None, client_host: str = "127.0.0.1") -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/tasks",
        "headers": [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()],
        "client": (client_host, 12345),
    }
    return Request(scope)


def test_authelia_allowed_users(monkeypatch):
    monkeypatch.setenv("DOMYTASKS_AUTHELIA_ENABLED", "true")
    monkeypatch.setenv("DOMYTASKS_AUTHELIA_TRUSTED_PROXIES", "127.0.0.0/8")
    monkeypatch.setenv("DOMYTASKS_AUTHELIA_ALLOWED_USERS", "rey,admin")
    get_settings.cache_clear()

    assert authelia_user(_request({"Remote-User": "rey"})) == "rey"
    assert authelia_user(_request({"Remote-User": "stranger"})) is None


def test_authelia_allowed_groups(monkeypatch):
    monkeypatch.setenv("DOMYTASKS_AUTHELIA_ENABLED", "true")
    monkeypatch.setenv("DOMYTASKS_AUTHELIA_TRUSTED_PROXIES", "127.0.0.0/8")
    monkeypatch.setenv("DOMYTASKS_AUTHELIA_ALLOWED_GROUPS", "admins")
    get_settings.cache_clear()

    assert authelia_user(
        _request({"Remote-User": "rey", "Remote-Groups": "users,admins"})
    ) == "rey"
    assert authelia_user(
        _request({"Remote-User": "rey", "Remote-Groups": "users"})
    ) is None


def test_authelia_untrusted_proxy(monkeypatch):
    monkeypatch.setenv("DOMYTASKS_AUTHELIA_ENABLED", "true")
    monkeypatch.setenv("DOMYTASKS_AUTHELIA_TRUSTED_PROXIES", "10.0.0.0/8")
    get_settings.cache_clear()

    assert authelia_user(_request({"Remote-User": "rey"}, client_host="127.0.0.1")) is None


def test_auth_method_for_request_local_auto_login(monkeypatch):
    monkeypatch.setenv("DOMYTASKS_LOCAL_AUTO_LOGIN", "true")
    get_settings.cache_clear()

    from domytasks.auth import auth_method_for_request

    assert auth_method_for_request(_request()) == "local"
    assert auth_method_for_request(_request(), include_session=False) is None
