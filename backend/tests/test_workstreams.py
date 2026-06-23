import pytest

from domytasks.service.exceptions import NotFoundError
from domytasks.service.tasks import create_task, get_task
from domytasks.service.workstreams import (
    create_workstream,
    delete_workstream,
    list_workstreams,
    resolve_workstream,
)


def test_slugify_collision(session):
    ws1 = create_workstream(session, "Engineering")
    ws2 = create_workstream(session, "Engineering")
    assert ws1.id == "engineering"
    assert ws2.id == "engineering-1"


def test_resolve_workstream_by_name(session):
    ws = create_workstream(session, "Home Projects")
    resolved = resolve_workstream(session, "home projects")
    assert resolved.id == ws.id


def test_resolve_workstream_not_found(session):
    with pytest.raises(NotFoundError):
        resolve_workstream(session, "missing")


def test_delete_workstream_cascades_tasks(session):
    ws = create_workstream(session, "Temp")
    task = create_task(session, workstream_id=ws.id, title="T", context="C")
    delete_workstream(session, ws.id)
    with pytest.raises(NotFoundError):
        get_task(session, task.id)
    assert list_workstreams(session) == []


def test_delete_workstream_not_found(session):
    with pytest.raises(NotFoundError):
        delete_workstream(session, "missing")
