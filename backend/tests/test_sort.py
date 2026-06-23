from datetime import datetime, timedelta

from domytasks.schemas import TaskCard, WorkstreamEmbed
from domytasks.service.sort import sort_task_models, sort_tasks
from domytasks.models import Task, TaskStatus


def _card(task_id: str, priority: int, due_at=None, sort_order=None) -> TaskCard:
    return TaskCard(
        id=task_id,
        title=task_id,
        status=TaskStatus.todo,
        priority=priority,
        due_at=due_at,
        workstream=WorkstreamEmbed(id="ws", name="WS"),
        sort_order=sort_order,
    )


def test_sort_by_priority():
    now = datetime.utcnow()
    cards = [
        _card("a", 1, now + timedelta(days=1)),
        _card("b", 3, now),
        _card("c", 2, None),
    ]
    ordered = sort_tasks(cards, "priority")
    assert [c.id for c in ordered] == ["b", "c", "a"]


def test_sort_by_due_at():
    now = datetime.utcnow()
    cards = [
        _card("a", 1, now + timedelta(days=3)),
        _card("b", 0, now),
        _card("c", 3, None),
    ]
    ordered = sort_tasks(cards, "due_at")
    assert ordered[0].id == "b"
    assert ordered[-1].id == "c"


def test_sort_by_manual():
    cards = [
        _card("a", 0, sort_order=2000),
        _card("b", 0, sort_order=1000),
        _card("c", 0, sort_order=None),
    ]
    ordered = sort_tasks(cards, "manual")
    assert [c.id for c in ordered] == ["b", "a", "c"]


def test_sort_task_models_updated_at():
    t1 = Task(id="1", workstream_id="ws", title="a", context="c", updated_at=datetime(2024, 1, 1))
    t2 = Task(id="2", workstream_id="ws", title="b", context="c", updated_at=datetime(2025, 1, 1))
    ordered = sort_task_models([t1, t2], "updated_at")
    assert ordered[0].id == "2"


def test_sort_by_priority_desc():
    cards = [
        _card("a", 1),
        _card("b", 3),
        _card("c", 2),
    ]
    ordered = sort_tasks(cards, "priority", sort_dir="desc")
    assert [c.id for c in ordered] == ["a", "c", "b"]


def test_sort_unknown_mode_defaults_to_priority():
    cards = [_card("a", 1), _card("b", 3)]
    ordered = sort_tasks(cards, "invalid")
    assert ordered[0].id == "b"
