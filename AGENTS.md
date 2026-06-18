# DoMyTasks — Agent integration

DoMyTasks exposes an MCP server for Claude, Hermes, Cursor, and other agents. Humans and agents share the same task data.

**Full guide:** [docs/agents.md](docs/agents.md)

## Quick reference

| | |
|---|---|
| MCP URL | `http://localhost:3603/mcp/` |
| Auth | `Authorization: Bearer <DOMYTASKS_TOKEN>` |
| Claude Desktop | Install `dist/domytasks.mcpb` (see docs) |

## Automatic routing

When the DoMyTasks MCP server is connected, it injects **server instructions** on `initialize` telling the model to use DoMyTasks for task-related questions (todos, backlog, priorities, due dates, add/complete/update work). Always read live state via tools — do not rely on chat memory.

Additional MCP primitives:

| Primitive | URI / name | Purpose |
|---|---|---|
| Resource | `domytasks://agent-guide` | Full workflow and tool reference |
| Prompt | `task_triage` | Prioritize open work |
| Prompt | `add_task_from_chat` | Capture a task from conversation |
| Prompt | `pick_up_task` | Claim and start work on a task |

Routing only applies when DoMyTasks MCP is **enabled** for that chat/session.

## Task model

- **`title` + `context`** required on every task — context is the agent pickup packet
- **`notes`** is human-only; don't rely on it
- Use **`task_claim`** for soft claims, **`task_complete`** to finish

## MCP tools

`workstream_list`, `workstream_create`, `task_list`, `task_get`, `task_create`, `task_update`, `task_delete`, `task_move`, `task_complete`, `task_claim`, `task_dashboard`, `task_kanban`
