import json
from datetime import datetime
from typing import Optional

from fastmcp import FastMCP
from sqlmodel import Session

from domytasks.db import get_engine
from domytasks.models import TaskStatus
from domytasks.schemas import ViewPrefsUpdate
from domytasks.service import settings as settings_service
from domytasks.service import tasks as tasks_service
from domytasks.service import views as views_service
from domytasks.service import workstreams as workstreams_service

mcp = FastMCP("DoMyTasks")


def _session() -> Session:
    return Session(get_engine())


def _json(data) -> str:
    if hasattr(data, "model_dump"):
        return json.dumps(data.model_dump(mode="json"), indent=2)
    if isinstance(data, list) and data and hasattr(data[0], "model_dump"):
        return json.dumps([d.model_dump(mode="json") for d in data], indent=2)
    return json.dumps(data, indent=2, default=str)


@mcp.tool(description="List all workstreams.")
def workstream_list() -> str:
    """Return all workstreams."""
    with _session() as session:
        streams = workstreams_service.list_workstreams(session)
        return _json(streams)


@mcp.tool(description="Create a new workstream. Example: name='Engineering', color='#3b82f6'")
def workstream_create(name: str, color: Optional[str] = None) -> str:
    """Create a workstream with optional color."""
    with _session() as session:
        ws = workstreams_service.create_workstream(session, name, color)
        return _json(ws)


@mcp.tool(
    description="List tasks with optional filters. sort_by: priority|due_at|updated_at|manual"
)
def task_list(
    workstream_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "priority",
    sort_dir: str = "desc",
) -> str:
    """Discover tasks."""
    with _session() as session:
        workstream_ids = [workstream_id] if workstream_id else None
        tasks = tasks_service.list_tasks(
            session,
            workstream_ids=workstream_ids,
            status=status,
            search=search,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        return _json(tasks)


@mcp.tool(description="Get a single task by id with full context.")
def task_get(task_id: str) -> str:
    """Read full task detail."""
    with _session() as session:
        task = tasks_service.get_task(session, task_id)
        return _json(task)


@mcp.tool(
    description="Create a task. Requires workstream_id, title, and context (agent pickup packet)."
)
def task_create(
    workstream_id: str,
    title: str,
    context: str,
    notes: Optional[str] = None,
    status: str = "todo",
    priority: int = 0,
    due_at: Optional[str] = None,
    source: Optional[str] = None,
) -> str:
    """Create a new task."""
    parsed_due = datetime.fromisoformat(due_at) if due_at else None
    with _session() as session:
        task = tasks_service.create_task(
            session,
            workstream_id=workstream_id,
            title=title,
            context=context,
            notes=notes,
            status=TaskStatus(status),
            priority=priority,
            due_at=parsed_due,
            source=source or "agent:mcp",
        )
        return _json(task)


@mcp.tool(description="Update task fields. Pass only fields to change.")
def task_update(
    task_id: str,
    workstream_id: Optional[str] = None,
    title: Optional[str] = None,
    context: Optional[str] = None,
    notes: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[int] = None,
    due_at: Optional[str] = None,
    source: Optional[str] = None,
) -> str:
    """Update an existing task."""
    fields = {}
    if workstream_id is not None:
        fields["workstream_id"] = workstream_id
    if title is not None:
        fields["title"] = title
    if context is not None:
        fields["context"] = context
    if notes is not None:
        fields["notes"] = notes
    if status is not None:
        fields["status"] = status
    if priority is not None:
        fields["priority"] = priority
    if due_at is not None:
        fields["due_at"] = datetime.fromisoformat(due_at)

    with _session() as session:
        task = tasks_service.update_task(
            session, task_id, source=source or "agent:mcp", **fields
        )
        return _json(task)


@mcp.tool(description="Delete a task permanently.", tags={"destructive"})
def task_delete(task_id: str, source: Optional[str] = None) -> str:
    """Delete a task."""
    with _session() as session:
        tasks_service.delete_task(session, task_id, source=source or "agent:mcp")
        return json.dumps({"deleted": task_id})


@mcp.tool(description="Move task to a new status column (todo|doing|done).")
def task_move(task_id: str, status: str, source: Optional[str] = None) -> str:
    """Change task status."""
    with _session() as session:
        task = tasks_service.move_task(
            session, task_id, status, source=source or "agent:mcp"
        )
        return _json(task)


@mcp.tool(description="Mark task done and clear any soft claim.")
def task_complete(task_id: str, source: Optional[str] = None) -> str:
    """Complete a task."""
    with _session() as session:
        task = tasks_service.complete_task(
            session, task_id, source=source or "agent:mcp"
        )
        return _json(task)


@mcp.tool(description="Set advisory claim on a task.")
def task_claim(
    task_id: str, claimed_by: str, source: Optional[str] = None
) -> str:
    """Soft-claim a task for an agent."""
    with _session() as session:
        task = tasks_service.claim_task(
            session, task_id, claimed_by, source=source or "agent:mcp"
        )
        return _json(task)


@mcp.tool(description="Dashboard view grouped by day, workstream, or flat.")
def task_dashboard(
    group_by: str = "day",
    sort_by: str = "priority",
    sort_dir: str = "desc",
    workstream_ids: Optional[str] = None,
) -> str:
    """Get dashboard layout."""
    ws_ids = workstream_ids.split(",") if workstream_ids else None
    with _session() as session:
        result = views_service.dashboard(
            session,
            group_by=group_by,
            sort_by=sort_by,
            workstream_ids=ws_ids,
            sort_dir=sort_dir,
        )
        return _json(result)


@mcp.tool(description="Kanban board with columns todo, doing, done.")
def task_kanban(
    sort_by: str = "priority",
    sort_dir: str = "desc",
    workstream_ids: Optional[str] = None,
    hide_done: bool = False,
) -> str:
    """Get kanban board."""
    ws_ids = workstream_ids.split(",") if workstream_ids else None
    with _session() as session:
        result = views_service.kanban(
            session,
            workstream_ids=ws_ids,
            sort_by=sort_by,
            hide_done=hide_done,
            sort_dir=sort_dir,
        )
        return _json(result)


mcp_app = mcp.http_app(path="/", stateless_http=True)
