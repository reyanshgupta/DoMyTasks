from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

from domytasks.models import TaskStatus


class AuthLogin(BaseModel):
    token: str


class AuthSession(BaseModel):
    authenticated: bool
    method: Optional[Literal["bearer", "session", "authelia", "local"]] = None
    user: Optional[str] = None
    authelia_enabled: bool = False


class WorkstreamEmbed(BaseModel):
    id: str
    name: str
    color: Optional[str] = None


class TaskCard(BaseModel):
    id: str
    title: str
    status: TaskStatus
    priority: int
    due_at: Optional[datetime] = None
    workstream: WorkstreamEmbed
    sort_order: Optional[float] = None
    claimed_by: Optional[str] = None


class TaskDetail(TaskCard):
    context: str
    notes: Optional[str] = None
    tags: Optional[list[str]] = None
    claimed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class WorkstreamOut(BaseModel):
    id: str
    name: str
    color: Optional[str] = None
    created_at: datetime


class WorkstreamCreate(BaseModel):
    name: str
    color: Optional[str] = None


class TaskCreate(BaseModel):
    workstream_id: str
    title: str
    context: str
    notes: Optional[str] = None
    status: TaskStatus = TaskStatus.todo
    priority: int = Field(default=0, ge=0, le=3)
    due_at: Optional[datetime] = None
    tags: Optional[list[str]] = None
    source: Optional[str] = None


class TaskUpdate(BaseModel):
    workstream_id: Optional[str] = None
    title: Optional[str] = None
    context: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[int] = Field(default=None, ge=0, le=3)
    due_at: Optional[datetime] = None
    tags: Optional[list[str]] = None
    source: Optional[str] = None


class TaskClaim(BaseModel):
    claimed_by: str
    source: Optional[str] = None


class TaskMove(BaseModel):
    status: TaskStatus
    source: Optional[str] = None


class TaskReorder(BaseModel):
    ordered_ids: list[str]
    scope: Optional[str] = None
    source: Optional[str] = None


class DashboardGroup(BaseModel):
    key: str
    label: str
    tasks: list[TaskCard]


class DashboardSummary(BaseModel):
    total: int
    by_status: dict[str, int]


class DashboardResponse(BaseModel):
    layout: str
    group_by: str
    sort_by: str
    groups: Optional[list[DashboardGroup]] = None
    tasks: Optional[list[TaskCard]] = None
    summary: DashboardSummary


class KanbanColumn(BaseModel):
    status: TaskStatus
    tasks: list[TaskCard]


class KanbanResponse(BaseModel):
    sort_by: str
    columns: list[KanbanColumn]


class ViewPrefs(BaseModel):
    view: Literal["kanban", "dashboard"] = "dashboard"
    group_by: Literal["day", "workstream", "flat"] = "flat"
    sort_by: Literal["priority", "due_at", "updated_at", "manual"] = "due_at"
    sort_dir: Literal["asc", "desc"] = "asc"
    workstream_ids: Optional[list[str]] = None
    hide_done: bool = False
    filters: Optional[dict[str, Any]] = None


class ViewPrefsUpdate(BaseModel):
    view: Optional[Literal["kanban", "dashboard"]] = None
    group_by: Optional[Literal["day", "workstream", "flat"]] = None
    sort_by: Optional[Literal["priority", "due_at", "updated_at", "manual"]] = None
    sort_dir: Optional[Literal["asc", "desc"]] = None
    workstream_ids: Optional[list[str]] = None
    hide_done: Optional[bool] = None
    filters: Optional[dict[str, Any]] = None
