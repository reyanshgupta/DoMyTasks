from datetime import datetime, timedelta

import pytest

from domytasks.models import TaskStatus
from domytasks.service.exceptions import NotFoundError, ValidationError
from domytasks.service.tasks import (
    claim_task,
    complete_task,
    create_task,
    delete_task,
    get_task,
    list_tasks,
    move_task,
    reorder_tasks,
    update_task,
)


def test_create_and_get_task(session, workstream):
    task = create_task(
        session,
        workstream_id=workstream.id,
        title="Fix auth",
        context="Update bearer middleware",
        priority=2,
    )
    assert task.title == "Fix auth"
    assert task.workstream.id == workstream.id
    assert task.priority == 2

    fetched = get_task(session, task.id)
    assert fetched.id == task.id
    assert fetched.context == "Update bearer middleware"


def test_create_requires_title_and_context(session, workstream):
    with pytest.raises(ValidationError):
        create_task(session, workstream_id=workstream.id, title="", context="x")
    with pytest.raises(ValidationError):
        create_task(session, workstream_id=workstream.id, title="x", context="")


def test_create_requires_valid_workstream(session):
    with pytest.raises(NotFoundError):
        create_task(
            session,
            workstream_id="missing",
            title="T",
            context="C",
        )


def test_update_task(session, workstream):
    task = create_task(
        session,
        workstream_id=workstream.id,
        title="Old",
        context="Ctx",
    )
    updated = update_task(
        session,
        task.id,
        title="New",
        priority=3,
        source="ui",
    )
    assert updated.title == "New"
    assert updated.priority == 3


def test_delete_task(session, workstream):
    task = create_task(
        session,
        workstream_id=workstream.id,
        title="Del",
        context="Ctx",
    )
    delete_task(session, task.id)
    with pytest.raises(NotFoundError):
        get_task(session, task.id)


def test_claim_and_complete_clears_claim(session, workstream):
    task = create_task(
        session,
        workstream_id=workstream.id,
        title="Claim me",
        context="Ctx",
    )
    claimed = claim_task(session, task.id, "agent:claude")
    assert claimed.claimed_by == "agent:claude"
    assert claimed.claimed_at is not None

    done = complete_task(session, task.id)
    assert done.status == TaskStatus.done
    assert done.claimed_by is None
    assert done.claimed_at is None


def test_move_task(session, workstream):
    task = create_task(
        session,
        workstream_id=workstream.id,
        title="Move",
        context="Ctx",
    )
    moved = move_task(session, task.id, TaskStatus.doing)
    assert moved.status == TaskStatus.doing


def test_list_tasks_filter_and_search(session, workstream):
    create_task(session, workstream_id=workstream.id, title="Alpha", context="one")
    create_task(session, workstream_id=workstream.id, title="Beta", context="two")
    all_tasks = list_tasks(session)
    assert len(all_tasks) == 2
    found = list_tasks(session, search="alpha")
    assert len(found) == 1
    assert found[0].title == "Alpha"


def test_reorder_tasks(session, workstream):
    t1 = create_task(session, workstream_id=workstream.id, title="A", context="c")
    t2 = create_task(session, workstream_id=workstream.id, title="B", context="c")
    reorder_tasks(session, [t2.id, t1.id])
    t1_ref = get_task(session, t1.id)
    t2_ref = get_task(session, t2.id)
    assert t2_ref.sort_order < t1_ref.sort_order
