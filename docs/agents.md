# Connecting Agents to DoMyTasks

DoMyTasks exposes an MCP server over Streamable HTTP at `/mcp`. The same bearer token used for the REST API is required.

## Endpoint

```
http://<host>:3603/mcp
```

- **Local:** `http://localhost:3603/mcp` (works for Hermes on the same machine and local desktop clients)
- **Remote:** expose via HTTPS reverse proxy (Caddy, nginx, Cloudflare Tunnel, Tailscale Funnel) so cloud clients can reach it

## Authentication

Set `DOMYTASKS_TOKEN` in your `.env` file. Pass it as a Bearer token:

```
Authorization: Bearer <your-token>
```

## Claude (custom connector)

1. Open Claude settings → Connectors / MCP
2. Add a custom connector
3. URL: `https://<your-public-host>/mcp`
4. Authentication: Bearer token with your `DOMYTASKS_TOKEN`

> Claude's web client cannot reach `localhost`. Use a tunnel or host on a reachable URL.

## Hermes

Configure MCP in Hermes with:

- **Transport:** HTTP (Streamable HTTP)
- **URL:** `http://localhost:3603/mcp` (or your remote URL)
- **Headers:** `Authorization: Bearer <token>`

## Available MCP tools

| Tool | Purpose |
|------|---------|
| `workstream_list` | List workstreams |
| `workstream_create` | Create a workstream |
| `task_list` | List/filter tasks |
| `task_get` | Get task with full context |
| `task_create` | Create task (title + context required) |
| `task_update` | Update task fields |
| `task_delete` | Delete task |
| `task_move` | Change status (todo/doing/done) |
| `task_complete` | Mark done, clear claim |
| `task_claim` | Soft-claim for an agent |
| `task_dashboard` | Dashboard view |
| `task_kanban` | Kanban board view |

## Example agent workflow

1. **Create workstream:** `workstream_create(name="Engineering")`
2. **Dump a task:** `task_create(workstream_id="engineering", title="Fix auth", context="...")`
3. **Discover:** `task_list()` or `task_kanban()`
4. **Pick up:** `task_get(task_id="...")` then `task_claim(task_id="...", claimed_by="agent:claude")`
5. **Update:** `task_update(task_id="...", context="...")`
6. **Done:** `task_complete(task_id="...")`

## Verification checklist

- [ ] Create workstream + task via agent
- [ ] Task visible at `GET /api/tasks` (with bearer token)
- [ ] Complete task via REST or UI
- [ ] Agent sees update via `task_list`
