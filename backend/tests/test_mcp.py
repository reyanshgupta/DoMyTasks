import pytest
from fastapi.testclient import TestClient

from domytasks.config import get_settings
from domytasks.db import reset_engine
from domytasks.main import create_app


@pytest.fixture
def mcp_client(tmp_path, monkeypatch):
    db_path = tmp_path / "mcp.db"
    monkeypatch.setenv("DOMYTASKS_DB_PATH", str(db_path))
    monkeypatch.setenv("DOMYTASKS_TOKEN", "test-token")
    get_settings.cache_clear()
    reset_engine()
    app = create_app()
    with TestClient(app) as c:
        yield c
    reset_engine()
    get_settings.cache_clear()


def test_mcp_endpoint_requires_auth(mcp_client):
    r = mcp_client.post("/mcp")
    assert r.status_code == 401


def test_mcp_endpoint_accepts_auth(mcp_client):
    r = mcp_client.get(
        "/mcp",
        headers={"Authorization": "Bearer test-token"},
    )
    # MCP may return 405 for GET or handle differently; not 401
    assert r.status_code != 401
