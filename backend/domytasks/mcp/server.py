import json
from datetime import datetime
from typing import Optional

from fastmcp import FastMCP
from sqlmodel import Session

from domytasks.db import get_engine
from domytasks.mcp.agent_guide import (
    AGENT_GUIDE_RESOURCE,
    SERVER_INSTRUCTIONS,
    add_task_from_chat_prompt,
    pick_up_task_prompt,
    task_triage_prompt,
)
from domytasks.models import TaskStatus
from domytasks.service import tasks as tasks_service
from domytasks.service import views as views_service
from domytasks.service import workstreams as workstreams_service

mcp = FastMCP("DoMyTasks", instructions=SERVER_INSTRUCTIONS)


def _session() -> Session:
    return Session(get_engine())


def _json(data) -> str:
    if hasattr(data, "model_dump"):
        return json.dumps(data.model_dump(mode="json"), indent=2)
    if isinstance(data, list) and data and hasattr(data[0], "model_dump"):
        return json.dumps([d.model_dump(mode="json") for d in data], indent=2)
    return json.dumps(data, indent=2, default=str)


@mcp.resource("domytasks://agent-guide")
def agent_guide() -> str:
    """Authoritative DoMyTasks agent conventions and workflow."""
    return AGENT_GUIDE_RESOURCE


@mcp.prompt
def task_triage() -> str:
    """Triage open tasks by priority and due date."""
    return task_triage_prompt()


@mcp.prompt
def add_task_from_chat(workstream_hint: str = "") -> str:
    """Capture a task from the current conversation."""
    return add_task_from_chat_prompt(workstream_hint)


@mcp.prompt
def pick_up_task(task_hint: str = "") -> str:
    """Claim and start work on a task."""
    return pick_up_task_prompt(task_hint)


@mcp.tool(description="List all workstreams.")
def workstream_list() -> str:
    """Return all workstreams."""
    with _session() as session:
        streams = workstreams_service.list_workstreams(session)
        return _json(streams)


@mcp.tool(
    description="Create a new workstream. Example: name='Engineering', color='#3b82f6'"
)
def workstream_create(name: str, color: Optional[str] = None) -> str:
    """Create a workstream with optional color."""
    with _session() as session:
        ws = workstreams_service.create_workstream(session, name, color)
        return _json(ws)


@mcp.tool(
    description=(
        "List the user's DoMyTasks backlog. Use when they ask about tasks, todos, "
        "priorities, or what's open. sort_by: priority|due_at|updated_at|manual"
    )
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


@mcp.tool(
    description="Read full task context before acting on a specific item."
)
def task_get(task_id: str) -> str:
    """Read full task detail."""
    with _session() as session:
        task = tasks_service.get_task(session, task_id)
        return _json(task)


@mcp.tool(
    description=(
        "Add a task to DoMyTasks. Use when the user wants to capture, track, or "
        "delegate work. Requires workstream_id, title, and context (agent pickup packet)."
    )
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


@mcp.tool(
    description=(
        "Grouped dashboard of the user's tasks. Use for due-date or workstream overviews."
    )
)
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


@mcp.tool(
    description=(
        "Board view of the user's tasks. Prefer for 'what am I working on?' or "
        "standup-style questions."
    )
)
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
