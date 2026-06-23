import json
from pathlib import Path

import pytest

from domytasks.config import get_settings
from domytasks.db import init_db, reset_engine
from domytasks.mcp.server import (
    task_claim,
    task_complete,
    task_create,
    task_delete,
    task_get,
    task_kanban,
    task_list,
    task_move,
    task_dashboard,
    workstream_create,
    workstream_delete,
    workstream_list,
)
from domytasks.service.exceptions import NotFoundError


@pytest.fixture
def mcp_db(tmp_path: Path, monkeypatch):
    db_path = tmp_path / "mcp-tools.db"
    monkeypatch.setenv("DOMYTASKS_DB_PATH", str(db_path))
    monkeypatch.setenv("DOMYTASKS_TOKEN", "test-token")
    get_settings.cache_clear()
    reset_engine()
    init_db(db_path)
    yield
    reset_engine()
    get_settings.cache_clear()


def test_workstream_list_create_delete(mcp_db):
    assert json.loads(workstream_list()) == []

    created = json.loads(workstream_create("Engineering", "#3b82f6"))
    assert created["name"] == "Engineering"

    listed = json.loads(workstream_list())
    assert len(listed) == 1

    deleted = json.loads(workstream_delete(created["id"]))
    assert deleted["deleted"] == created["id"]
    assert json.loads(workstream_list()) == []


def test_task_lifecycle(mcp_db):
    ws = json.loads(workstream_create("Eng"))
    ws_id = ws["id"]

    created = json.loads(
        task_create(
            workstream_id=ws_id,
            title="Fix bug",
            context="Reproduce and patch",
            priority=2,
        )
    )
    task_id = created["id"]
    assert created["title"] == "Fix bug"

    fetched = json.loads(task_get(task_id))
    assert fetched["context"] == "Reproduce and patch"

    listed = json.loads(task_list(workstream_id=ws_id))
    assert len(listed) == 1

    claimed = json.loads(task_claim(task_id, "agent:test"))
    assert claimed["claimed_by"] == "agent:test"

    moved = json.loads(task_move(task_id, "doing"))
    assert moved["status"] == "doing"

    completed = json.loads(task_complete(task_id))
    assert completed["status"] == "done"
    assert completed["claimed_by"] is None

    deleted = json.loads(task_delete(task_id))
    assert deleted["deleted"] == task_id

    with pytest.raises(NotFoundError):
        task_get(task_id)


def test_task_dashboard_and_kanban(mcp_db):
    ws = json.loads(workstream_create("Eng"))
    json.loads(
        task_create(
            workstream_id=ws["id"],
            title="Open task",
            context="ctx",
        )
    )

    dashboard = json.loads(task_dashboard(group_by="flat"))
    assert dashboard["summary"]["total"] == 1

    board = json.loads(task_kanban())
    assert len(board["columns"]) == 3
    assert len(board["columns"][0]["tasks"]) == 1
