from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from domytasks.api.deps import get_db, get_source
from domytasks.models import TaskStatus
from domytasks.schemas import (
    TaskCard,
    TaskClaim,
    TaskCreate,
    TaskDetail,
    TaskMove,
    TaskReorder,
    TaskUpdate,
)
from domytasks.service import tasks as tasks_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskCard])
def list_tasks(
    workstream_id: str | None = None,
    status: TaskStatus | None = None,
    search: str | None = None,
    sort_by: str = "priority",
    sort_dir: str = "desc",
    session: Session = Depends(get_db),
):
    workstream_ids = [workstream_id] if workstream_id else None
    return tasks_service.list_tasks(
        session,
        workstream_ids=workstream_ids,
        status=status,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@router.post("", response_model=TaskDetail, status_code=201)
def create_task(
    body: TaskCreate,
    session: Session = Depends(get_db),
    source: str = Depends(get_source),
):
    return tasks_service.create_task(
        session,
        workstream_id=body.workstream_id,
        title=body.title,
        context=body.context,
        notes=body.notes,
        status=body.status,
        priority=body.priority,
        due_at=body.due_at,
        tags=body.tags,
        source=body.source or source,
    )


@router.post("/reorder", response_model=list[TaskCard])
def reorder_tasks(
    body: TaskReorder,
    session: Session = Depends(get_db),
    source: str = Depends(get_source),
):
    return tasks_service.reorder_tasks(
        session,
        body.ordered_ids,
        scope=body.scope,
        source=body.source or source,
    )


@router.get("/{task_id}", response_model=TaskDetail)
def get_task(task_id: str, session: Session = Depends(get_db)):
    return tasks_service.get_task(session, task_id)


@router.patch("/{task_id}", response_model=TaskDetail)
def update_task(
    task_id: str,
    body: TaskUpdate,
    session: Session = Depends(get_db),
    source: str = Depends(get_source),
):
    fields = body.model_dump(exclude_unset=True, exclude={"source"})
    return tasks_service.update_task(
        session,
        task_id,
        source=body.source or source,
        **fields,
    )


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: str,
    session: Session = Depends(get_db),
    source: str = Depends(get_source),
):
    tasks_service.delete_task(session, task_id, source=source)


@router.post("/{task_id}/complete", response_model=TaskDetail)
def complete_task(
    task_id: str,
    session: Session = Depends(get_db),
    source: str = Depends(get_source),
):
    return tasks_service.complete_task(session, task_id, source=source)


@router.post("/{task_id}/claim", response_model=TaskDetail)
def claim_task(
    task_id: str,
    body: TaskClaim,
    session: Session = Depends(get_db),
    source: str = Depends(get_source),
):
    return tasks_service.claim_task(
        session,
        task_id,
        body.claimed_by,
        source=body.source or source,
    )


@router.post("/{task_id}/move", response_model=TaskDetail)
def move_task(
    task_id: str,
    body: TaskMove,
    session: Session = Depends(get_db),
    source: str = Depends(get_source),
):
    return tasks_service.move_task(
        session,
        task_id,
        body.status,
        source=body.source or source,
    )
