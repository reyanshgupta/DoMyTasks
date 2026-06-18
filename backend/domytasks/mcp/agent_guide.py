"""Agent routing guidance for DoMyTasks MCP clients."""

SERVER_INSTRUCTIONS = """\
DoMyTasks is the user's authoritative task backlog when this server is connected.

When the user asks about tasks, todos, their backlog, what's in progress, due dates,
priorities, or wants to add, complete, update, claim, or delegate work — use DoMyTasks
tools first. Do not rely on conversation memory for task state; always read live data.

Task model:
- title + context are required on every task (context is the agent pickup packet)
- notes is human-only scratchpad; do not rely on it
- Use task_claim for soft claims, task_complete to finish

Recommended first calls:
- task_kanban — board overview, standup-style questions
- task_list — filtered search and priorities
- task_get — full detail before acting on one task

Read domytasks://agent-guide for workflow details and tool reference.
"""

AGENT_GUIDE_RESOURCE = """\
# DoMyTasks Agent Guide

DoMyTasks is agent-first task management. Humans and agents share one database.

## When to use DoMyTasks

Use DoMyTasks tools whenever the user mentions:
- tasks, todos, backlog, to-do list
- what they're working on, what's open, what's due
- adding, updating, completing, or claiming work
- priorities, workstreams, kanban, dashboard views

## Task model

| Field | Role |
|---|---|
| title | Short label (required) |
| context | Agent pickup packet: instructions, links, paths, constraints (required) |
| notes | Human scratchpad only — agents must not rely on it |
| status | todo, doing, or done |
| priority | 0=none, 1=low, 2=medium, 3=high |
| due_at | ISO 8601 datetime |
| claimed_by | Advisory soft claim (not a lock) |

Every task belongs to a workstream. List or create workstreams before creating tasks.

## Recommended workflow

1. workstream_list() — find or pick a workstream
2. task_kanban(hide_done=True) or task_list() — discover open work
3. task_get(task_id) — read full pickup packet
4. task_claim(task_id, claimed_by="agent:...") — signal you're on it
5. task_move(task_id, "doing") — move to in-progress
6. task_update(...) — refresh context as you learn
7. task_complete(task_id) — done

## Tool reference

**Workstreams:** workstream_list, workstream_create

**Discovery:** task_list, task_get, task_kanban, task_dashboard

**CRUD:** task_create (requires workstream_id, title, context), task_update, task_delete

**Workflow:** task_move, task_complete, task_claim

## MCP prompts

- task_triage — what should I work on?
- add_task_from_chat — capture a task from conversation
- pick_up_task — claim and start work on a task
"""


def task_triage_prompt() -> str:
    """Morning standup / prioritization template."""
    return (
        "Triage my DoMyTasks backlog. Call task_kanban with hide_done=True, "
        "then summarize open tasks by priority and due date. Highlight what's "
        "overdue or highest priority and suggest what to tackle first."
    )


def add_task_from_chat_prompt(workstream_hint: str = "") -> str:
    """Capture task intent from the current conversation."""
    hint = (
        f" Prefer workstream: {workstream_hint}."
        if workstream_hint.strip()
        else ""
    )
    return (
        "Add a task to DoMyTasks based on our conversation."
        f"{hint} Call workstream_list if you need a workstream_id. "
        "Write a concise title and a rich context field (pickup packet with "
        "instructions, links, file paths, and constraints). Do not put agent "
        "instructions in notes."
    )


def pick_up_task_prompt(task_hint: str = "") -> str:
    """Claim and start work on a task."""
    hint = (
        f" The user mentioned: {task_hint}."
        if task_hint.strip()
        else ""
    )
    return (
        "Pick up a DoMyTasks task and prepare to work on it."
        f"{hint} Use task_list or task_kanban to find the right task, "
        "task_get to read full context, task_claim to soft-claim it for "
        "yourself, and task_move to set status to doing. Summarize the "
        "pickup packet before proceeding."
    )
