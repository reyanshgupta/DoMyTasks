# Agents & Claude

DoMyTasks is **agent-first**: every task has a **title** and **context** (the pickup packet an agent needs to act without prior conversation). Humans and agents share one service layer — MCP and REST hit the same database with the same rules.

This guide covers connecting **Claude** (Desktop and web) and other **MCP agents** (Hermes, Cursor, etc.).

---

## Prerequisites

1. **DoMyTasks running**

   ```bash
   cp .env.example .env   # set DOMYTASKS_TOKEN
   docker compose up -d
   ```

2. **Bearer token** — copy `DOMYTASKS_TOKEN` from `.env`. MCP and scripted REST requests need:

   ```
   Authorization: Bearer <your-token>
   ```

3. **Health check**

   ```bash
   curl http://localhost:3603/health
   # → {"status":"ok"}
   ```

---

## MCP endpoint

| | |
|---|---|
| **Transport** | Streamable HTTP |
| **URL** | `http://<host>:3603/mcp/` |
| **Auth** | Bearer token (`DOMYTASKS_TOKEN`) |

> Use the **trailing slash** (`/mcp/`). Requests to `/mcp` without it may fail with 405.

| Environment | URL |
|---|---|
| Local (same machine) | `http://localhost:3603/mcp/` |
| Remote / Claude web | `https://<your-public-host>/mcp/` via HTTPS reverse proxy or tunnel |

---

## Claude Desktop (recommended)

One-click install via the MCPB extension — no manual connector JSON.

### Build the extension

```bash
cd extensions/claude-desktop
npm run pack
```

Creates `dist/domytasks.mcpb` at the repo root.

### Install

1. **Claude Desktop** → **Settings** → **Extensions** → **Advanced settings** → **Install Extension…**
2. Select `dist/domytasks.mcpb` (or double-click the file)
3. Configure:
   - **Server URL:** `http://localhost:3603` (no `/mcp` suffix — the extension adds it)
   - **Bearer token:** your `DOMYTASKS_TOKEN` from `.env`
4. Enable the extension for new chats

### Verify

Ask Claude:

> *"Use DoMyTasks to list workstreams and create a test task in the first workstream."*

You should see tool calls like `workstream_list` and `task_create`. The task appears in the web UI at http://localhost:3603.

### Troubleshooting (Claude Desktop)

| Symptom | Fix |
|---|---|
| Server disconnected right after connecting | Reinstall `dist/domytasks.mcpb` **v1.0.2+**. Older builds used `mcp-remote`, which expects OAuth and crashes against bearer-only auth. |
| Connection refused | Start DoMyTasks: `docker compose up -d` |
| Unauthorized | Token must match `DOMYTASKS_TOKEN` in `.env` exactly |
| Tools not visible | Enable the extension for the current chat; restart Claude Desktop after install |

See [extensions/claude-desktop/README.md](../extensions/claude-desktop/README.md) for extension-specific details.

---

## Claude on the web (claude.ai)

Claude's **web client cannot reach `localhost`**. Expose DoMyTasks on a public HTTPS URL first.

### 1. Expose DoMyTasks

Pick one:

- **Cloudflare Tunnel** — `cloudflared tunnel --url http://localhost:3603`
- **Tailscale Funnel** — `tailscale funnel 3603`
- **Caddy / nginx** — reverse proxy with TLS to `:3603`

Use the resulting `https://…` host.

### 2. Add a custom connector

1. Claude → **Settings** → **Connectors** (or **MCP**)
2. **Add custom connector**
3. **URL:** `https://<your-public-host>/mcp/`
4. **Authentication:** Bearer token → paste `DOMYTASKS_TOKEN`

### 3. Verify

In a new chat with the connector enabled:

> *"List my DoMyTasks workstreams."*

---

## Hermes

Configure MCP in Hermes:

| Setting | Value |
|---|---|
| Transport | HTTP (Streamable HTTP) |
| URL | `http://localhost:3603/mcp/` (or your remote URL) |
| Headers | `Authorization: Bearer <token>` |

Hermes on the same machine as Docker can use `localhost`. For remote Hermes, expose DoMyTasks the same way as Claude web.

---

## Cursor & other MCP clients

Any client that supports **Streamable HTTP MCP** with custom headers can connect.

Example `.cursor/mcp.json` (adjust path and token):

```json
{
  "mcpServers": {
    "domytasks": {
      "url": "http://localhost:3603/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_DOMYTASKS_TOKEN"
      }
    }
  }
}
```

Replace `YOUR_DOMYTASKS_TOKEN` with the value from `.env`. Restart Cursor after saving.

For remote access, swap `localhost` for your public HTTPS URL (same as Claude web).

---

## Automatic task routing

When DoMyTasks MCP connects, the server injects routing guidance so agents treat it as the user's **authoritative task backlog** — without the user having to say "use DoMyTasks" every time.

### What gets injected

| Layer | Mechanism | When it applies |
|---|---|---|
| Server instructions | `initialize` response | Every MCP connect (Cursor, Claude Desktop, Claude web, Hermes) |
| Tool descriptions | `tools/list` | Discovery tools include routing hints (e.g. task_kanban for standup questions) |
| MCP prompts | `prompts/list` | Reusable workflow templates (see below) |
| Agent guide resource | `domytasks://agent-guide` | Deep reference when the model needs conventions |

### MCP prompts

| Prompt | Use when |
|---|---|
| `task_triage` | User asks what to work on, morning standup, priority review |
| `add_task_from_chat` | User wants to capture work from the current conversation |
| `pick_up_task` | User wants to claim and start a specific task |

Prompts are served by the backend at runtime. The Claude Desktop extension proxies them — they are not duplicated in the `.mcpb` manifest.

### Optional client reinforcement

If routing is inconsistent, add client-side instructions:

**Claude project instructions:**

> When I ask about tasks, todos, or my backlog, use the DoMyTasks MCP server.

**Cursor rule** (`.cursor/rules/domytasks.mdc`):

> When the user asks about tasks, todos, or their backlog, use the DoMyTasks MCP server.

### Limitations

- Routing requires DoMyTasks MCP to be **enabled** for that chat/session
- If other task apps are also connected (Todoist, Linear, etc.), the model may need disambiguation — DoMyTasks instructions scope to the DoMyTasks backlog
- Not every client surfaces prompts/resources in UI; server instructions + tool descriptions are the reliable baseline

### Verify routing

With DoMyTasks MCP enabled, try generic phrasing (no "DoMyTasks" in the message):

> *"What's on my task list?"*

> *"Add a task to fix the login redirect bug."*

The agent should call `task_kanban` / `task_list` or `task_create` without being told which tool to use.

---

## Data model (what agents should know)

### Tasks = title + context

- **`title`** — short label (required)
- **`context`** — markdown-friendly pickup packet: instructions, links, file paths, constraints, current state (required)
- **`notes`** — human scratchpad; agents should **not** rely on this

### Workstreams

Every task belongs to a **workstream** (e.g. Engineering, Personal). List or create them before creating tasks.

### Status & workflow

| Status | Meaning |
|---|---|
| `todo` | Not started |
| `doing` | In progress |
| `done` | Complete |

Use `task_move` or `task_complete` to change status. `task_complete` also clears any soft claim.

### Soft claims

`task_claim(task_id, claimed_by="agent:claude")` sets an **advisory** claim — not a lock. Other agents or humans can still edit the task. Use claims to signal "I'm working on this."

### Priority & due dates

- **Priority:** `0` = none, `1` = low, `2` = medium, `3` = high
- **Due date:** ISO 8601 string, e.g. `2026-06-20T17:00:00`

### Source field

Writes accept optional `source` (e.g. `agent:claude`, `agent:hermes`). Defaults to `agent:mcp`. Used for audit/debugging only — not permissions.

---

## MCP tools

All tools return JSON strings.

### Workstreams

| Tool | Description |
|---|---|
| `workstream_list` | List all workstreams |
| `workstream_create` | Create workstream — `name` (required), `color` (optional hex, e.g. `#3b82f6`) |

### Tasks — CRUD

| Tool | Description |
|---|---|
| `task_list` | List/filter tasks — use when user asks about todos, backlog, or priorities |
| `task_get` | Full task detail by `task_id` — read before acting on one item |
| `task_create` | Create task — use when user wants to capture or delegate work |
| `task_update` | Update fields — pass only what changes |
| `task_delete` | Permanently delete (destructive) |

**`task_list` filters:** `workstream_id`, `status`, `search`, `sort_by` (`priority` \| `due_at` \| `updated_at` \| `manual`), `sort_dir` (`asc` \| `desc`)

**`task_create` optional fields:** `notes`, `status` (default `todo`), `priority` (default `0`), `due_at` (ISO string), `source`

### Tasks — workflow

| Tool | Description |
|---|---|
| `task_move` | Move to `todo` \| `doing` \| `done` |
| `task_complete` | Mark done, clear claim |
| `task_claim` | Soft-claim — `task_id`, `claimed_by` (e.g. `agent:claude`) |

### Views

| Tool | Description |
|---|---|
| `task_dashboard` | Grouped view — due-date or workstream overviews |
| `task_kanban` | Kanban columns — prefer for standup / "what am I working on?" |

---

## Recommended agent workflow

```
1. workstream_list()           → find or pick a workstream
2. workstream_create(...)      → if none exist yet
3. task_create(...)            → dump intent as title + rich context
4. task_kanban() or task_list() → discover what's open
5. task_get(task_id)           → read full pickup packet
6. task_claim(..., claimed_by) → signal you're on it
7. task_move(..., "doing")     → move to in-progress
8. task_update(...)            → refresh context as you learn
9. task_complete(task_id)      → done
```

Humans can do any step in the web UI instead — changes are visible immediately to agents.

---

## Example prompts

**Dump a task from conversation:**

> *"Add a DoMyTasks task in Engineering: title 'Fix login redirect', context should include that users hitting /auth/callback get a 404, the bug is in `auth/middleware.ts`, and we need to preserve the return URL."*

**Morning triage:**

> *"Show my DoMyTasks kanban, hide done. What's highest priority due this week?"*

**Pick up and work:**

> *"Claim the auth redirect task for yourself, move it to doing, and summarize the context."*

**Close out:**

> *"Mark the auth redirect task complete and list what's still in doing."*

---

## REST API (alternative for agents)

Same bearer token, same data. Useful for scripts or clients without MCP.

| | |
|---|---|
| Base URL | `http://localhost:3603/api` |
| Auth | `Authorization: Bearer <token>` |

Examples:

```bash
TOKEN=your-token

# List tasks
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3603/api/tasks | jq

# Create task
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"workstream_id":"...","title":"...","context":"..."}' \
  http://localhost:3603/api/tasks
```

Full route list mirrors MCP capabilities — see [spec-v1.md](spec-v1.md).

---

## Web dashboard auth

The browser dashboard does not need the bearer token on every refresh. Enter
`DOMYTASKS_TOKEN` once in the web UI; DoMyTasks sets a signed `HttpOnly` session
cookie for `/api` requests. MCP remains bearer-token only.

For Authelia, protect DoMyTasks with your reverse proxy and forward Authelia's
trusted header response values, especially `Remote-User`, to the backend only
from that proxy. Enable it with:

```env
DOMYTASKS_AUTHELIA_ENABLED=true
DOMYTASKS_AUTHELIA_TRUSTED_PROXIES=<proxy-ip-or-cidr>
```

Optional allowlists:

```env
DOMYTASKS_AUTHELIA_ALLOWED_USERS=rey,alex
DOMYTASKS_AUTHELIA_ALLOWED_GROUPS=admin,dev
```

Use `DOMYTASKS_WEB_SESSION_SECURE=true` when the dashboard is served over HTTPS.

---

## Security notes

- Keep `DOMYTASKS_TOKEN` secret — treat it like a password
- Never commit `.env` or paste tokens into chats that get logged
- For public exposure, use HTTPS, a strong random token, and secure cookies
- Authelia header auth must only trust headers from your reverse proxy
- Bearer/session auth is v1 — no per-user accounts; one token/session = full access

---

## Verification checklist

- [ ] `curl http://localhost:3603/health` returns `ok`
- [ ] Agent connects without disconnect (Claude Desktop extension v1.0.2+ or custom connector)
- [ ] MCP `initialize` returns routing instructions (or agent responds to "What's on my task list?" with `task_kanban`/`task_list`)
- [ ] `workstream_list` returns workstreams
- [ ] `task_create` creates a task visible in web UI
- [ ] `task_complete` marks done; `task_list` reflects the change
- [ ] Human edit in UI is visible to agent on next `task_get`

---

## See also

- [spec-v1.md](spec-v1.md) — full product spec
- [README.md](../README.md) — quick start and development
- [extensions/claude-desktop/README.md](../extensions/claude-desktop/README.md) — MCPB extension build/install
