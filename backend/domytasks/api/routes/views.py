from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from domytasks.api.deps import get_db
from domytasks.schemas import DashboardResponse, KanbanResponse
from domytasks.service import views as views_service

router = APIRouter(tags=["views"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    group_by: str = Query(default="day"),
    sort_by: str = Query(default="priority"),
    sort_dir: str = Query(default="desc"),
    workstream_ids: list[str] | None = Query(default=None),
    session: Session = Depends(get_db),
):
    return views_service.dashboard(
        session,
        group_by=group_by,
        sort_by=sort_by,
        workstream_ids=workstream_ids,
        sort_dir=sort_dir,
    )


@router.get("/kanban", response_model=KanbanResponse)
def get_kanban(
    sort_by: str = Query(default="priority"),
    sort_dir: str = Query(default="desc"),
    workstream_ids: list[str] | None = Query(default=None),
    hide_done: bool = Query(default=False),
    session: Session = Depends(get_db),
):
    return views_service.kanban(
        session,
        workstream_ids=workstream_ids,
        sort_by=sort_by,
        hide_done=hide_done,
        sort_dir=sort_dir,
    )
