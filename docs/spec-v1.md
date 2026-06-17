# DoMyTasks — Spec Plan

A minimal task tracker that runs as **a single Docker container** — on your laptop, a server, anywhere — listening on **port 3603**. It is **agent-first** in design (every task has **title + context** any agent can pick up cold) but **human + agent in harmony** in practice: you add, edit, and delete tasks in the web app *or* by talking to an agent — both hit the same service layer, same rules, same truth. Work gets done through **agents over MCP** (Claude, Hermes); you also manage tasks directly when that's faster. One source of truth underneath all of it.

The tracker ships empty. You define your own workstreams at runtime; the system has no built-in opinion about what they are.

**About this spec:** Directional, not a frozen contract. It captures intent and hard constraints (title + context, one service layer, human/agent parity). Implementation details — tool names, exact API params, stack choices, view defaults — may change as you or an agent build it. Avoid treating any "recommended" or "default" here as immovable.

---

## 1. Goal & Non-Goals

**Goal**
- Every task is a **pickup packet**: a **title** (what it is) and **context** (everything an agent needs to act — links, files, constraints, current state). Optional **notes** are for you, not agents.
- Track tasks across however many **workstreams** you create — added at runtime, not baked in; every task belongs to one.
- **Human + agent in harmony** — full CRUD from either surface. Add a task in the UI, or tell an agent "create a task for …"; edit context in a form, or ask an agent to update it; delete either way. No primary write path — two equal doors into the same core.
- **Agent pickup** — talk to an agent in natural language over MCP to create, query, claim, update, and complete tasks. NL is great for dumping messy intent; the agent structures it into title + context.
- **Direct human control** — web app (phone later) for the same operations: create, edit, delete, complete, move. Forms when you want precision; agents when you want conversation.
- **Query & views** — agents use `task_list` (filters, search); you use **views** to scan work: customizable dashboard (by day / workstream / flat), plus a **Kanban board** (by status). Switch views as needed; prefs can be saved.
- Every task surfaces **workstream**, **priority**, and **due date** in lists, dashboard, and Kanban cards — even when a date isn't set (show empty / "no date").
- **Sorting** — automatic (priority, due date, updated) or **manual** drag-order when you want control.
- Ship as **one portable Docker container on port 3603** — runs identically locally or on a remote host; where it runs is your choice, not the app's concern.

**Non-goals (simple on purpose)**
- No sprints, epics, story points, Gantt, approvals, or workflow engines.
- No multi-tenant / team permissions — single user.
- No pre-seeded categories, projects, or templates. Empty until you fill it.
- No hosting opinion baked in. The image binds 3603; reachability is a deploy-time decision (see §11).
- No bulk-import UI or file upload in v1 — tasks enter one at a time via UI forms or agent conversation.

---

## 2. Architecture — One Core, Two Equal Surfaces

```
   Claude  ──┐                                    ┌──  Web app (now)
 (web/desktop)│                                   │    Phone app (later)
             ├─▶ ┌─────────────────────┐          │
   Hermes  ──┘   │  MCP server          │   ┌──────────────────────┐
                 │  (Streamable HTTP)   │   │  REST / JSON API      │ ◀┘
                 │  — agent CRUD        │   │  — human CRUD + views │
                 └─────────────────────┘   └──────────────────────┘
                            │                          │
                            └──────────┬───────────────┘
                                       ▼
                            ┌────────────────────┐
                            │   Service layer     │   ← shared logic: CRUD, views,
                            │ (CRUD + queries +   │      sort, filters
                            │  dashboard/kanban)  │
                            └────────────────────┘
                                       │
                                       ▼
                            ┌────────────────────┐
                            │  SQLite (one file)  │
                            └────────────────────┘

       all of the above run inside one container, listening on :3603
```

**The split (conceptual):**
- **MCP** — agents create, read, update, delete tasks via tools. You talk in natural language; the agent calls MCP. One endpoint can serve Claude, Hermes, or other MCP clients.
- **REST** — you create, edit, delete tasks in the web/phone UI via HTTP, plus view endpoints (dashboard, kanban) and saved layout prefs.
- **Neither surface owns writes.** Both translate into the same service layer. Changes from either side should appear immediately to the other.

**Coherence goal:** keep business logic in the service layer (not duplicated in MCP handlers or the frontend). Same fields and validation regardless of who made the change. Exact tool names and routes are starting points — agents may add or rename them if the core model stays consistent.

---

## 3. Data Model

Two tables for domain data, plus settings — all empty at first run.

**`workstreams`** — created by you at runtime, no defaults; every task belongs to one
| field | type | notes |
|---|---|---|
| id | text (uuid/slug) | primary key |
| name | text | whatever you name it |
| color | text | optional, used by UI |
| created_at | timestamp | |

**`tasks`** — the agent pickup unit
| field | type | notes |
|---|---|---|
| id | text (uuid) | primary key |
| workstream_id | text | FK → workstreams.id, required |
| title | text | required — short label |
| context | text | required — the agent pickup packet: instructions, links, file paths, constraints, current state. Markdown-friendly. |
| notes | text | optional — human scratchpad; agents should not rely on this |
| status | enum | `todo` / `doing` / `done` |
| priority | int | 0=none … 3=high — shown on every task card |
| due_at | timestamp | nullable — shown on every task card ("no date" when null) |
| tags | text[] / json | optional |
| sort_order | float | nullable — for manual drag ordering within a column/list |
| claimed_by | text | nullable — soft claim (advisory) |
| claimed_at | timestamp | nullable — when the soft claim was set |
| created_at | timestamp | |
| updated_at | timestamp | bump on every write |

**Field roles:**
- **`title` + `context`** — agent pickup unit. Richer context = easier handoff; enforcement level is up to implementation.
- **`workstream_id`** — required; resolved to name/color in API responses so every view can show it without extra lookups.
- **`priority` + `due_at`** — always returned and displayed in UI cards (Kanban, dashboard, lists). Nullable due date is fine; show explicitly.
- **`sort_order`** — used when `sort_by=manual`; drag-reorder in Kanban or flat lists updates this.
- **`notes`** — human scratchpad; agents typically ignore.
- **`claimed_by` / `claimed_at`** — optional soft claim, not a lock.
- **`status`** — drives Kanban columns (`todo` / `doing` / `done`); maps to drag-between-columns in the UI.

**Task card minimum (all views):** title, workstream (name + color), priority, due date, status. Context on expand/detail.

**`settings`** — single-user prefs
| field | type | notes |
|---|---|---|
| key | text | e.g. `view_prefs` |
| value | json | saved view: `view`, `group_by`, `sort_by`, `sort_dir`, filters, kanban scope, etc. |

---

## 4. How Work Flows (human + agent in harmony)

Two paths, one truth. Pick whichever fits the moment.

### Via agent (conversation)

1. **Dump** — you tell an agent what needs doing; it calls `task_create` with title + rich context (and a workstream).
2. **Discover** — agent calls `task_list`, `task_kanban`, or `task_dashboard`.
3. **Pick up** — agent reads `get_task`, optionally `task_claim`.
4. **Act** — agent does the work; updates via `task_update` as state changes.
5. **Done** — `task_complete` clears the soft claim.

### Via UI (direct)

1. **Create** — `POST /api/tasks` from a form (title + context required, same validation as MCP).
2. **Scan** — Kanban, dashboard, or per-workstream list.
3. **Edit** — `PATCH /api/tasks/{id}` — fix context, change due date, bump priority.
4. **Done or gone** — `complete` or `DELETE`.

### What keeps it harmonious

- **Same fields, same validation** — ideally no relaxed schema for UI vs agent.
- **Instant visibility** — one DB; no separate inboxes.
- **Either can finish the other's work.**
- **Audit, not permission** — optional `source` on writes (`ui` vs `agent:<name>`) for debugging.

---

## 5. Service Layer (the shared core)

Shared logic — likely pure functions over the DB. Starting API sketch (may evolve):

- `create_workstream(name, color=None)` / `list_workstreams()`
- `create_task(...)` / `get_task` / `update_task` / `delete_task` / `complete_task` / `move_task` / `claim_task`
- `list_tasks(...)` — filters, search, sort (incl. `sort_by=manual` using `sort_order`)
- `reorder_tasks(ordered_ids, scope?)` — batch update `sort_order` after drag-drop
- **`dashboard(...)`** — grouped views: day / workstream / flat (see §8)
- **`kanban(...)`** — columns by status, tasks sorted per column (see §8)
- `get_view_prefs()` / `set_view_prefs(...)` — persist last-used view layout

Design notes (flexible):
- Workstream by name or id — resolve internally; helpful error if missing.
- `list_tasks` / view endpoints: support `sort_by` = `priority` | `due_at` | `updated_at` | **`manual`**
- Kanban column change (drag task todo→doing) → `update_task` status; within-column drag → `reorder_tasks`
- Mutators ideally return the full task object.

---

## 6. MCP Server (agent CRUD)

Agents connect over **Streamable HTTP** (or whatever transport fits) at something like `:3603/mcp`. Tool set mirrors the service layer — names and hints are a starting point:

| tool (example) | intent |
|---|---|
| `workstream_list` / `workstream_create` | list / create streams |
| `task_list` / `task_get` | discover / read |
| `task_create` / `task_update` / `task_delete` | CRUD |
| `task_move` / `task_complete` / `task_claim` | lifecycle |
| `task_dashboard` / `task_kanban` | read views (optional for agents) |

Guidelines (not requirements): useful schemas with examples; readOnly/destructive hints where applicable; structured + human-readable responses. Agents implementing this may add tools (e.g. bulk update) if useful.

---

## 7. REST / JSON API (human CRUD + views)

Starting routes at `:3603/api` — shape may evolve; should stay aligned with MCP capabilities:

```
GET/POST  /api/workstreams
GET/POST  /api/tasks
GET/PATCH/DELETE  /api/tasks/{id}
POST      /api/tasks/{id}/move | /complete | /claim
POST      /api/tasks/reorder          { ordered_ids: [...] }
GET       /api/dashboard?group_by=day|workstream|flat&sort_by=...&...
GET       /api/kanban?workstream=&sort_by=priority|due_at|manual&...
GET/PATCH /api/settings/view          → saved view prefs
```

---

- JSON in/out; bearer auth (§10).
- Full CRUD + view endpoints. Optional `source: ui` on writes for audit.

---

## 8. Views (dashboard, Kanban, lists)

Cross-workstream visibility with **workstream, priority, and due date on every task**. User picks view + sort; can save prefs.

### Shared task shape (lists, dashboard, Kanban)

Every task in a view response includes at least:
```json
{
  "id", "title", "status", "priority", "due_at",
  "workstream": { "id", "name", "color" },
  "sort_order", "claimed_by"
}
```
Context on detail/expand — not required on every card if space is tight.

### Sort modes

| `sort_by` | behavior |
|---|---|
| `priority` | priority desc, then due_at asc |
| `due_at` | due date asc (nulls last), then priority |
| `updated_at` | recently touched first |
| **`manual`** | `sort_order` asc — user drag order wins |

User can switch sort mode per view. Manual sort persists via `sort_order` + `POST /api/tasks/reorder`.

### Dashboard (grouped views)

| param | values | notes |
|---|---|---|
| `group_by` | `day` \| `workstream` \| `flat` | bucket layout |
| `sort_by` | see above | within each bucket |
| `workstream_ids` | filter | omit = all |

Day buckets: overdue / today / tomorrow / this_week / later / no_date. Response includes `layout`, `groups` or `tasks`, `summary`.

### Kanban (status columns)

Important v1 view. Columns = **`todo` | `doing` | `done`** (optionally hide `done` or collapse it).

```
┌── Kanban ────────────────────────────────────────────────────────────┐
│  View: [Kanban ▾]  Sort: [Manual ▾]  Workstreams: [All ▾]  [+ New]   │
│  ──────────────────────────────────────────────────────────────────── │
│   TODO (4)          DOING (2)         DONE (8)                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                  │
│  │ ● A  P2     │   │ ● B  P3     │   │ ● C  P1     │                  │
│  │ fix auth    │   │ ship v2     │   │ old task    │                  │
│  │ due: Jun 18 │   │ due: today  │   │ due: —      │                  │
│  └─────────────┘   └─────────────┘   └─────────────┘                  │
│  ┌─────────────┐   ┌─────────────┐                                     │
│  │ ● B  P1     │   │ ● A  P2     │   drag between columns → status    │
│  │ write spec  │   │ test API    │   drag within column → sort_order  │
│  │ due: —      │   │ due: Jun 20 │                                     │
│  └─────────────┘   └─────────────┘                                     │
└────────────────────────────────────────────────────────────────────────┘
```

- **Card shows:** workstream color/dot, title, priority, due date (or "no date").
- **Drag across columns** → update `status` (and optionally `claimed_by` when moving to doing).
- **Drag within column** → `reorder_tasks` when `sort_by=manual`.
- **Filter** by workstream subset — default all streams mixed in each column.
- Kanban and dashboard are peers; user switches via view picker. Either can be the default in saved prefs.

### Dashboard wireframe (alternate view)

```
┌── DoMyTasks ─────────────────────────────────────────────────────────┐
│  View: [Day ▾]  Sort: [Priority ▾]  Workstreams: [All ▾]  [+ New]    │
│  [Overdue]     TODAY          TOMORROW       THIS WEEK      No date  │
│  ●A P3 Jun16   ●B P2 today    ●C P1 Jun19    ●D P2 Fri      ●A P0 —  │
│  fix auth      ship v2        call vendor    review PR      idea     │
└──────────────────────────────────────────────────────────────────────┘
```
Each row: workstream dot, priority, due date, title.

### View prefs

`PATCH /api/settings/view` — store `view` (`kanban` | `dashboard`), `group_by`, `sort_by`, filters. Web/phone reopen last layout.

---

## 9. Frontend (web now, phone later)

Likely approach: **Next.js + Tailwind PWA** served from the same container — not a hard requirement.

- **Kanban** — status columns, drag between columns (status) and within column (manual sort). Cards show workstream, priority, due date.
- **Dashboard** — day / workstream / flat grouping; same card fields.
- **Full CRUD** — create/edit/delete tasks; detail panel for context.
- Thin client over `/api` — grouping, sort, Kanban logic in service layer where possible.
- Native phone app later if needed — same REST API.

---

## 10. Auth

One bearer-token check on every request, MCP and REST alike:
- Your Claude (custom connector) and Hermes present the token to `/mcp`; the web/phone app presents it to `/api`.
- Token in an env var, never in code. Log `source` (`ui` vs `agent:<name>`) on every write for debugging.
- OAuth 2.1 is the fuller MCP-spec answer; skip for v1.

---

## 11. Running It (your choice, not the app's)

The container binds **`0.0.0.0:3603`** and serves `/mcp`, `/api`, and the static web app from that one port. Where and how you reach it is a deploy-time decision:

- **Locally** (laptop): `http://localhost:3603`. Works immediately for Hermes-on-the-same-box, a local agent, and your browser. Note: Claude's *web* client can't reach `localhost` — for that you'd expose it (below) or use a local desktop client.
- **Public host**: put any reverse proxy you like in front for HTTPS — Caddy (auto-Let's-Encrypt), nginx + certbot, a Cloudflare Tunnel, or Tailscale Funnel. The proxy terminates TLS and forwards to `:3603`. This is the only setup where your web Claude reaches it as a custom connector.
- Either way the **image is identical** — TLS/proxy lives outside it. Keep 3603 bound to localhost behind the proxy when public; expose it directly only on trusted networks.

---

## 12. Concurrency & Deployment

- **SQLite WAL mode** for concurrent reads + serialized writes; bump `updated_at` per write; optimistic lock (`If-Match`) only if you ever see clobbering. Last-write-wins is fine for v1.
- One image (FastMCP + FastAPI sharing the service module + the static web build), a volume for the DB:

```
docker-compose.yml
  domytasks:
    build: .
    ports:    ["3603:3603"]
    env_file: .env          # bearer token, etc.
    volumes:  ["./data:/data"]   # /data/domytasks.db
    restart:  unless-stopped
  # (optional) add a caddy/nginx/cloudflared service here ONLY when exposing publicly
```

`docker compose up` → reachable on 3603. `cp data/domytasks.db` is your backup.

---

## 13. Stack (current lean, not locked)

Likely v1 stack based on familiarity — **agents may choose differently** if constraints are met:

| layer | current lean | constraint |
|---|---|---|
| backend | Python, FastAPI, FastMCP, SQLite/SQLModel | one process, one service module, port 3603 |
| frontend | Next.js, Tailwind, static PWA build | thin client, Kanban + dashboard + CRUD |
| deploy | single Docker image + volume for DB | portable, binds 3603 |

TypeScript MCP server is a valid swap if SDK ergonomics matter more than Python velocity.

---

## 14. Build Phases

| Phase | Deliverable | "Done" when… |
|---|---|---|
| 0 | Schema + service layer + tests | CRUD, views, manual sort from REPL |
| 1 | MCP server | core tools working |
| 2 | REST API | `/api/kanban`, `/api/dashboard`, `/api/tasks`, reorder |
| 3 | Dockerize | one image on :3603 + volume |
| 4 | Connect agents | Claude + Hermes |
| 5 | Web app | Kanban + dashboard + full CRUD |
| 6 | (later) native phone app | only if you want push / deeper OS hooks |
| 7 | (stretch) tags, search, recurring, NL due-dates | no rush |

Phase 0 tests cover logic once; every surface only needs thin "does it translate" tests.

---

## 15. Stretch Ideas (not v1)

- Natural-language due dates ("next Friday" → timestamp) in the service layer.
- A `task_triage` tool / dashboard view: agent-built daily plan from overdue + due-today + high-priority.
- iCal export so Apple Reminders / Calendar can read it natively.
- Webhooks on task events so Hermes reacts to changes it didn't make.
- Push notifications (the main reason to ever go native on the phone).
- Bulk import (JSON/markdown paste) — deferred from v1; add tasks via UI form or agent conversation.

---

**TL;DR:** Agent-first task tracker, human + agent in harmony. Tasks = **title + context** in a workstream, with **priority, due date, and workstream visible everywhere**. Views: **Kanban** (status columns) + customizable **dashboard** (day/stream/flat), sortable by priority/date/manual drag. Two write paths (MCP + REST) → one service layer → SQLite. One Docker container on :3603. Spec is directional — implementation may evolve.