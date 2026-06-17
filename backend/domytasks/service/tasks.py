import json
import logging
from datetime import datetime

from sqlmodel import Session, select
from ulid import ULID

from domytasks.models import Task, TaskStatus, Workstream
from domytasks.schemas import TaskCard, TaskDetail, WorkstreamEmbed
from domytasks.service.exceptions import NotFoundError, ValidationError
from domytasks.service.sort import sort_task_models
from domytasks.service.workstreams import resolve_workstream

logger = logging.getLogger(__name__)


def _parse_tags(tags: str | None) -> list[str] | None:
    if tags is None:
        return None
    return json.loads(tags)


def _serialize_tags(tags: list[str] | None) -> str | None:
    if tags is None:
        return None
    return json.dumps(tags)


def _embed_workstream(ws: Workstream) -> WorkstreamEmbed:
    return WorkstreamEmbed(id=ws.id, name=ws.name, color=ws.color)


def _to_card(task: Task, ws: Workstream) -> TaskCard:
    return TaskCard(
        id=task.id,
        title=task.title,
        status=task.status,
        priority=task.priority,
        due_at=task.due_at,
        workstream=_embed_workstream(ws),
        sort_order=task.sort_order,
        claimed_by=task.claimed_by,
    )


def _to_detail(task: Task, ws: Workstream) -> TaskDetail:
    return TaskDetail(
        id=task.id,
        title=task.title,
        status=task.status,
        priority=task.priority,
        due_at=task.due_at,
        workstream=_embed_workstream(ws),
        sort_order=task.sort_order,
        claimed_by=task.claimed_by,
        context=task.context,
        notes=task.notes,
        tags=_parse_tags(task.tags),
        claimed_at=task.claimed_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def _get_task_row(session: Session, task_id: str) -> Task:
    task = session.get(Task, task_id)
    if not task:
        raise NotFoundError("task", task_id)
    return task


def _get_workstream_for_task(session: Session, task: Task) -> Workstream:
    ws = session.get(Workstream, task.workstream_id)
    if not ws:
        raise NotFoundError("workstream", task.workstream_id)
    return ws


def _log_write(action: str, task_id: str, source: str | None) -> None:
    logger.info("task %s id=%s source=%s", action, task_id, source or "unknown")


def create_task(
    session: Session,
    *,
    workstream_id: str,
    title: str,
    context: str,
    notes: str | None = None,
    status: TaskStatus | str = TaskStatus.todo,
    priority: int = 0,
    due_at: datetime | None = None,
    tags: list[str] | None = None,
    source: str | None = None,
) -> TaskDetail:
    if not title.strip():
        raise ValidationError("title is required")
    if not context.strip():
        raise ValidationError("context is required")

    ws = resolve_workstream(session, workstream_id)
    priority = max(0, min(3, priority))

    task = Task(
        id=str(ULID()),
        workstream_id=ws.id,
        title=title.strip(),
        context=context,
        notes=notes,
        status=TaskStatus(status) if isinstance(status, str) else status,
        priority=priority,
        due_at=due_at,
        tags=_serialize_tags(tags),
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    _log_write("created", task.id, source)
    return _to_detail(task, ws)


def get_task(session: Session, task_id: str) -> TaskDetail:
    task = _get_task_row(session, task_id)
    ws = _get_workstream_for_task(session, task)
    return _to_detail(task, ws)


def update_task(
    session: Session,
    task_id: str,
    *,
    source: str | None = None,
    **fields,
) -> TaskDetail:
    task = _get_task_row(session, task_id)

    if "workstream_id" in fields and fields["workstream_id"] is not None:
        ws = resolve_workstream(session, fields["workstream_id"])
        task.workstream_id = ws.id

    if "title" in fields and fields["title"] is not None:
        if not fields["title"].strip():
            raise ValidationError("title is required")
        task.title = fields["title"].strip()

    if "context" in fields and fields["context"] is not None:
        if not fields["context"].strip():
            raise ValidationError("context is required")
        task.context = fields["context"]

    if "notes" in fields:
        task.notes = fields["notes"]

    if "status" in fields and fields["status"] is not None:
        task.status = TaskStatus(fields["status"]) if isinstance(fields["status"], str) else fields["status"]

    if "priority" in fields and fields["priority"] is not None:
        task.priority = max(0, min(3, fields["priority"]))

    if "due_at" in fields:
        task.due_at = fields["due_at"]

    if "tags" in fields:
        task.tags = _serialize_tags(fields["tags"])

    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    ws = _get_workstream_for_task(session, task)
    _log_write("updated", task.id, source)
    return _to_detail(task, ws)


def delete_task(session: Session, task_id: str, *, source: str | None = None) -> None:
    task = _get_task_row(session, task_id)
    session.delete(task)
    session.commit()
    _log_write("deleted", task_id, source)


def complete_task(session: Session, task_id: str, *, source: str | None = None) -> TaskDetail:
    task = _get_task_row(session, task_id)
    task.status = TaskStatus.done
    task.claimed_by = None
    task.claimed_at = None
    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    ws = _get_workstream_for_task(session, task)
    _log_write("completed", task.id, source)
    return _to_detail(task, ws)


def claim_task(
    session: Session,
    task_id: str,
    claimed_by: str,
    *,
    source: str | None = None,
) -> TaskDetail:
    task = _get_task_row(session, task_id)
    task.claimed_by = claimed_by
    task.claimed_at = datetime.utcnow()
    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    ws = _get_workstream_for_task(session, task)
    _log_write("claimed", task.id, source)
    return _to_detail(task, ws)


def move_task(
    session: Session,
    task_id: str,
    status: TaskStatus | str,
    *,
    source: str | None = None,
) -> TaskDetail:
    task = _get_task_row(session, task_id)
    task.status = TaskStatus(status) if isinstance(status, str) else status
    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    ws = _get_workstream_for_task(session, task)
    _log_write("moved", task.id, source)
    return _to_detail(task, ws)


def list_tasks(
    session: Session,
    *,
    workstream_ids: list[str] | None = None,
    status: TaskStatus | str | None = None,
    search: str | None = None,
    sort_by: str = "priority",
    sort_dir: str = "desc",
) -> list[TaskCard]:
    query = select(Task)
    if workstream_ids:
        query = query.where(Task.workstream_id.in_(workstream_ids))
    if status is not None:
        st = TaskStatus(status) if isinstance(status, str) else status
        query = query.where(Task.status == st)

    tasks = list(session.exec(query).all())

    if search:
        needle = search.lower()
        tasks = [
            t
            for t in tasks
            if needle in t.title.lower() or needle in t.context.lower()
        ]

    tasks = sort_task_models(tasks, sort_by, sort_dir)

    cards: list[TaskCard] = []
    for task in tasks:
        ws = _get_workstream_for_task(session, task)
        cards.append(_to_card(task, ws))
    return cards


def reorder_tasks(
    session: Session,
    ordered_ids: list[str],
    scope: str | None = None,
    *,
    source: str | None = None,
) -> list[TaskCard]:
    updated: list[TaskCard] = []
    for index, task_id in enumerate(ordered_ids):
        task = _get_task_row(session, task_id)
        task.sort_order = float(index * 1000)
        task.updated_at = datetime.utcnow()
        session.add(task)
        session.commit()
        session.refresh(task)
        ws = _get_workstream_for_task(session, task)
        updated.append(_to_card(task, ws))
        _log_write("reordered", task.id, source)
    return updated
