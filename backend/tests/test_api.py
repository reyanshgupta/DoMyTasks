import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from domytasks.config import get_settings
from domytasks.db import reset_engine
from domytasks.main import create_app


@pytest.fixture
def client(tmp_path: Path, monkeypatch):
    db_path = tmp_path / "api.db"
    monkeypatch.setenv("DOMYTASKS_DB_PATH", str(db_path))
    monkeypatch.setenv("DOMYTASKS_TOKEN", "test-token")
    get_settings.cache_clear()
    reset_engine()
    app = create_app()
    with TestClient(app) as c:
        yield c
    reset_engine()
    get_settings.cache_clear()


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test-token"}


def test_health_no_auth(client):
    r = client.get("/health")
    assert r.status_code == 200


def test_unauthorized_without_token(client):
    r = client.get("/api/tasks")
    assert r.status_code == 401


def test_workstream_crud(client, auth_headers):
    r = client.post(
        "/api/workstreams",
        json={"name": "Engineering", "color": "#3b82f6"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    ws = r.json()
    assert ws["name"] == "Engineering"

    r = client.get("/api/workstreams", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_task_crud(client, auth_headers):
    ws = client.post(
        "/api/workstreams",
        json={"name": "Eng"},
        headers=auth_headers,
    ).json()

    r = client.post(
        "/api/tasks",
        json={
            "workstream_id": ws["id"],
            "title": "Fix auth",
            "context": "Bearer middleware",
            "priority": 2,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    task = r.json()
    assert task["title"] == "Fix auth"

    r = client.get(f"/api/tasks/{task['id']}", headers=auth_headers)
    assert r.status_code == 200

    r = client.patch(
        f"/api/tasks/{task['id']}",
        json={"title": "Fixed auth"},
        headers=auth_headers,
    )
    assert r.json()["title"] == "Fixed auth"

    r = client.post(
        f"/api/tasks/{task['id']}/complete",
        headers=auth_headers,
    )
    assert r.json()["status"] == "done"

    r = client.delete(f"/api/tasks/{task['id']}", headers=auth_headers)
    assert r.status_code == 204


def test_kanban_and_dashboard(client, auth_headers):
    ws = client.post(
        "/api/workstreams",
        json={"name": "Eng"},
        headers=auth_headers,
    ).json()
    client.post(
        "/api/tasks",
        json={"workstream_id": ws["id"], "title": "T", "context": "C"},
        headers=auth_headers,
    )

    r = client.get("/api/kanban", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()["columns"]) == 3

    r = client.get("/api/dashboard?group_by=flat", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()["tasks"]) == 1


def test_view_prefs(client, auth_headers):
    r = client.get("/api/settings/view", headers=auth_headers)
    assert r.json()["view"] == "kanban"

    r = client.patch(
        "/api/settings/view",
        json={"view": "dashboard", "group_by": "flat"},
        headers=auth_headers,
    )
    assert r.json()["view"] == "dashboard"
