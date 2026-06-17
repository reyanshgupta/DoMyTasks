from datetime import datetime, timedelta

from domytasks.models import TaskStatus
from domytasks.service.settings import get_view_prefs, set_view_prefs
from domytasks.service.tasks import create_task
from domytasks.service.views import dashboard, kanban
from domytasks.schemas import ViewPrefsUpdate


def test_dashboard_day_buckets(session, workstream):
    today = datetime.utcnow().replace(hour=12, minute=0, second=0, microsecond=0)
    create_task(
        session,
        workstream_id=workstream.id,
        title="Overdue",
        context="c",
        due_at=today - timedelta(days=2),
    )
    create_task(
        session,
        workstream_id=workstream.id,
        title="Today",
        context="c",
        due_at=today,
    )
    create_task(
        session,
        workstream_id=workstream.id,
        title="No date",
        context="c",
    )

    result = dashboard(session, group_by="day")
    assert result.group_by == "day"
    keys = {g.key for g in result.groups}
    assert "overdue" in keys
    assert "today" in keys
    assert "no_date" in keys


def test_dashboard_flat(session, workstream):
    create_task(session, workstream_id=workstream.id, title="A", context="c")
    create_task(session, workstream_id=workstream.id, title="B", context="c")
    result = dashboard(session, group_by="flat")
    assert len(result.tasks) == 2


def test_kanban_columns(session, workstream):
    create_task(session, workstream_id=workstream.id, title="Todo", context="c")
    t2 = create_task(
        session,
        workstream_id=workstream.id,
        title="Doing",
        context="c",
        status=TaskStatus.doing,
    )
    create_task(
        session,
        workstream_id=workstream.id,
        title="Done",
        context="c",
        status=TaskStatus.done,
    )

    board = kanban(session)
    assert len(board.columns) == 3
    assert board.columns[0].status == TaskStatus.todo
    assert len(board.columns[1].tasks) == 1
    assert board.columns[1].tasks[0].id == t2.id


def test_kanban_hide_done(session, workstream):
    create_task(
        session,
        workstream_id=workstream.id,
        title="Done",
        context="c",
        status=TaskStatus.done,
    )
    board = kanban(session, hide_done=True)
    assert len(board.columns) == 2


def test_view_prefs_defaults_and_update(session):
    prefs = get_view_prefs(session)
    assert prefs.view == "kanban"
    assert prefs.sort_by == "priority"

    updated = set_view_prefs(session, ViewPrefsUpdate(view="dashboard", group_by="flat"))
    assert updated.view == "dashboard"
    assert updated.group_by == "flat"

    loaded = get_view_prefs(session)
    assert loaded.view == "dashboard"
