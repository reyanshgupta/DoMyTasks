from datetime import date, datetime, timedelta

from sqlmodel import Session, select

from domytasks.models import Task, TaskStatus
from domytasks.schemas import (
    DashboardGroup,
    DashboardResponse,
    DashboardSummary,
    KanbanColumn,
    KanbanResponse,
    TaskCard,
)
from domytasks.service.sort import sort_task_models
from domytasks.service.tasks import _get_workstream_for_task, _to_card, reorder_tasks
from domytasks.service.workstreams import list_workstreams

# Re-export reorder_tasks for convenience
__all__ = ["dashboard", "kanban", "reorder_tasks"]


def _fetch_tasks(
    session: Session,
    workstream_ids: list[str] | None = None,
    exclude_done: bool = False,
) -> list[Task]:
    query = select(Task)
    if workstream_ids:
        query = query.where(Task.workstream_id.in_(workstream_ids))
    if exclude_done:
        query = query.where(Task.status != TaskStatus.done)
    return list(session.exec(query).all())


def _tasks_to_cards(session: Session, tasks: list[Task]) -> list[TaskCard]:
    cards = []
    for task in tasks:
        ws = _get_workstream_for_task(session, task)
        cards.append(_to_card(task, ws))
    return cards


def _day_bucket(due: datetime | None, today: date) -> str:
    if due is None:
        return "no_date"
    d = due.date() if isinstance(due, datetime) else due
    if d < today:
        return "overdue"
    if d == today:
        return "today"
    if d == today + timedelta(days=1):
        return "tomorrow"
    week_end = today + timedelta(days=(6 - today.weekday()))
    if d <= week_end:
        return "this_week"
    return "later"


DAY_BUCKETS = [
    ("overdue", "Overdue"),
    ("today", "Today"),
    ("tomorrow", "Tomorrow"),
    ("this_week", "This week"),
    ("later", "Later"),
    ("no_date", "No date"),
]


def dashboard(
    session: Session,
    group_by: str = "day",
    sort_by: str = "priority",
    workstream_ids: list[str] | None = None,
    sort_dir: str = "desc",
) -> DashboardResponse:
    tasks = _fetch_tasks(session, workstream_ids)
    today = date.today()

    summary = DashboardSummary(
        total=len(tasks),
        by_status={
            "todo": sum(1 for t in tasks if t.status == TaskStatus.todo),
            "doing": sum(1 for t in tasks if t.status == TaskStatus.doing),
            "done": sum(1 for t in tasks if t.status == TaskStatus.done),
        },
    )

    if group_by == "flat":
        sorted_tasks = sort_task_models(tasks, sort_by, sort_dir)
        return DashboardResponse(
            layout="flat",
            group_by="flat",
            sort_by=sort_by,
            tasks=_tasks_to_cards(session, sorted_tasks),
            summary=summary,
        )

    if group_by == "workstream":
        workstreams = list_workstreams(session)
        if workstream_ids:
            workstreams = [ws for ws in workstreams if ws.id in workstream_ids]
        groups: list[DashboardGroup] = []
        for ws in workstreams:
            ws_tasks = [t for t in tasks if t.workstream_id == ws.id]
            sorted_ws = sort_task_models(ws_tasks, sort_by, sort_dir)
            groups.append(
                DashboardGroup(
                    key=ws.id,
                    label=ws.name,
                    tasks=_tasks_to_cards(session, sorted_ws),
                )
            )
        return DashboardResponse(
            layout="grouped",
            group_by="workstream",
            sort_by=sort_by,
            groups=groups,
            summary=summary,
        )

    # group_by == "day"
    buckets: dict[str, list[Task]] = {key: [] for key, _ in DAY_BUCKETS}
    for task in tasks:
        bucket = _day_bucket(task.due_at, today)
        buckets[bucket].append(task)

    groups = []
    for key, label in DAY_BUCKETS:
        sorted_bucket = sort_task_models(buckets[key], sort_by, sort_dir)
        groups.append(
            DashboardGroup(
                key=key,
                label=label,
                tasks=_tasks_to_cards(session, sorted_bucket),
            )
        )

    return DashboardResponse(
        layout="grouped",
        group_by="day",
        sort_by=sort_by,
        groups=groups,
        summary=summary,
    )


def kanban(
    session: Session,
    workstream_ids: list[str] | None = None,
    sort_by: str = "priority",
    hide_done: bool = False,
    sort_dir: str = "desc",
) -> KanbanResponse:
    tasks = _fetch_tasks(session, workstream_ids)
    columns: list[KanbanColumn] = []
    statuses = [TaskStatus.todo, TaskStatus.doing]
    if not hide_done:
        statuses.append(TaskStatus.done)

    for status in statuses:
        col_tasks = [t for t in tasks if t.status == status]
        sorted_col = sort_task_models(col_tasks, sort_by, sort_dir)
        columns.append(
            KanbanColumn(
                status=status,
                tasks=_tasks_to_cards(session, sorted_col),
            )
        )

    return KanbanResponse(sort_by=sort_by, columns=columns)
