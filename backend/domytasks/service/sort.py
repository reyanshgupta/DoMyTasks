from datetime import datetime
from typing import Sequence

from domytasks.models import Task, TaskStatus
from domytasks.schemas import TaskCard

SORT_MODES = ("priority", "due_at", "updated_at", "manual")


def _nulls_last_dt(value: datetime | None) -> tuple[int, datetime]:
    if value is None:
        return (1, datetime.max)
    return (0, value)


def sort_tasks(
    tasks: Sequence[TaskCard],
    sort_by: str,
    sort_dir: str = "asc",
) -> list[TaskCard]:
    if sort_by not in SORT_MODES:
        sort_by = "priority"

    if sort_by == "priority":
        ordered = sorted(
            tasks,
            key=lambda t: (-t.priority, _nulls_last_dt(t.due_at)),
        )
    elif sort_by == "due_at":
        ordered = sorted(
            tasks,
            key=lambda t: (_nulls_last_dt(t.due_at), -t.priority),
        )
    elif sort_by == "updated_at":
        # TaskCard doesn't carry updated_at; callers should sort before card conversion
        # or pass Task objects. For cards, preserve input order.
        ordered = list(tasks)
    elif sort_by == "manual":
        ordered = sorted(
            tasks,
            key=lambda t: (
                t.sort_order is None,
                t.sort_order if t.sort_order is not None else float("inf"),
            ),
        )
    else:
        ordered = list(tasks)

    if sort_dir == "desc" and sort_by != "manual":
        ordered = list(reversed(ordered))

    return ordered


def sort_task_models(
    tasks: Sequence[Task],
    sort_by: str,
    sort_dir: str = "asc",
) -> list[Task]:
    if sort_by not in SORT_MODES:
        sort_by = "priority"

    if sort_by == "priority":
        ordered = sorted(
            tasks,
            key=lambda t: (-t.priority, _nulls_last_dt(t.due_at)),
        )
    elif sort_by == "due_at":
        ordered = sorted(
            tasks,
            key=lambda t: (_nulls_last_dt(t.due_at), -t.priority),
        )
    elif sort_by == "updated_at":
        ordered = sorted(tasks, key=lambda t: t.updated_at, reverse=True)
    elif sort_by == "manual":
        ordered = sorted(
            tasks,
            key=lambda t: (
                t.sort_order is None,
                t.sort_order if t.sort_order is not None else float("inf"),
            ),
        )
    else:
        ordered = list(tasks)

    if sort_dir == "desc" and sort_by not in ("updated_at", "manual"):
        ordered = list(reversed(ordered))

    return ordered
