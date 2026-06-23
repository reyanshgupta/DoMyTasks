<p align="center">
  <img src="frontend/public/domytasks-logo.png" alt="DoMyTasks" width="120" />
</p>

<h1 align="center">DoMyTasks</h1>

<p align="center">
  <strong>A simple task tracker built for working with AI agents.</strong><br/>
  Self-hosted · free · one backlog for you and your assistant
</p>

<p align="center">
  <a href="https://github.com/reyanshgupta/DoMyTasks"><img src="https://img.shields.io/badge/docker-single%20container-2496ED?logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="docs/agents.md"><img src="https://img.shields.io/badge/MCP-agent%20tools-6366f1?logo=anthropic&logoColor=white" alt="MCP" /></a>
  <img src="https://img.shields.io/badge/python-3.12+-3776AB?logo=python&logoColor=white" alt="Python 3.12+" />
  <img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="License: Apache-2.0" />
</p>

<p align="center">
  <a href="#why-i-built-this">Why</a> ·
  <a href="#get-started">Quick start</a> ·
  <a href="docs/agents.md">Agents</a> ·
  <a href="#agent-compatibility">Clients</a> ·
  <a href="#development">Development</a>
</p>

---

## Why I built this

I got tired of juggling a dozen task apps, and none of them being **simple**, **actually useful with AI agents**, or **free without a paywall**.

I use AI to help with my work every day. I wanted something where:

- **My assistant can keep track of my stuff**: add tasks from conversation, read what's open, update context as it learns
- **I can see what it's doing**: when it picks something up, moves it to doing, or finishes it, that shows up in my list too
- **It's just tasks**: no sprints, no teams, no enterprise workflow nonsense

So I built DoMyTasks. One list. You manage it in the browser, or your agent manages it over MCP. Same data either way.

## What it does

- **Simple web app**: Kanban board, dashboard, workstreams, drag-and-drop
- **Agent-native**: MCP tools so Claude, Cursor, and other agents can create, update, claim, and complete tasks
- **Shared visibility**: when your agent claims a task or marks it done, you see it immediately
- **Title + context**: every task has a short title and a **context** field with everything an agent needs to pick up the work cold
- **Self-hosted**: one Docker container, your data stays on your machine
- **No paywall**: it's yours, run it wherever you want

## How it works

```
  You                          Your AI assistant
  (browser)                    (Claude, Cursor, …)
      │                              │
      ▼                              ▼
┌──────────────────────────────────────────────┐
│                  DoMyTasks                    │
│                                               │
│   Web UI  ◄──── same tasks ────►  MCP tools  │
│                                               │
│              one list, one truth              │
└──────────────────────────────────────────────┘
```

You add a task in the UI, or tell your agent *"add a task to fix the login bug."* Your agent reads the backlog, claims what it's working on, and marks things done. You always know the current state without asking.

→ [Agent setup guide](docs/agents.md) · [Product spec](docs/spec-v1.md)

## Get started

```bash
git clone https://github.com/reyanshgupta/DoMyTasks.git && cd DoMyTasks
cp .env.example .env          # set DOMYTASKS_TOKEN to something secret
docker compose up --build
```

Open **http://localhost:3603** — the dashboard loads with no login screen. Local auto-login is on by default (`DOMYTASKS_LOCAL_AUTO_LOGIN=true` in `.env.example`).

### Browser vs agent auth

| Who | What you do |
|---|---|
| **You (browser)** | Just open the app. No token to paste when local auto-login is enabled. |
| **Agents (MCP / API)** | Use `DOMYTASKS_TOKEN` from `.env` as a bearer token. |

If you turn off local auto-login (`DOMYTASKS_LOCAL_AUTO_LOGIN=false`), paste your token once in the browser — a session cookie keeps you signed in after that. Turn it off when exposing DoMyTasks beyond a trusted machine.

**Connect Claude Desktop** (easiest path):

```bash
cd extensions/claude-desktop && npm run pack
```

Install `dist/domytasks.mcpb` in Claude Desktop → Settings → Extensions. Use your server URL and the same token from `.env`.

Then try: *"What's on my task list?"* Your agent should pull it up without you explaining how.

Full setup for Cursor, Claude web, Hermes, and remote access → [docs/agents.md](docs/agents.md)

## Task model

Every task is a **pickup packet**: enough for an agent to start without prior conversation.

| Field | Role |
|---|---|
| **title** | Short label |
| **context** | What to do, links, file paths, constraints, current state |
| **notes** | Your private scratchpad. Agents ignore this. |
| **workstream** | Category you create (Engineering, Home, whatever) |
| **status** | `todo` · `doing` · `done` |
| **claimed_by** | Who's working on it, so you can see what your agent picked up |

## Agent compatibility

| Client | Works? | Notes |
|---|---|---|
| Claude Desktop | ✅ | [MCPB extension](extensions/claude-desktop/README.md) |
| Claude web | ✅ | Custom connector |
| Cursor | ✅ | MCP config with bearer token |
| Hermes | ✅ | Streamable HTTP |
| Scripts | ✅ | REST API, same data |

## When to use · When to skip

**This is for you if…**

- you use AI daily and want it to actually manage your backlog, not just talk about it
- you want to *see* what your agent is working on, not wonder what happened in chat
- you're done paying for bloated project tools that don't talk to agents

**Skip it if…**

- you need teams, permissions, or sprint planning
- you don't use agents and just want a basic todo app

## Documentation

| Start here | Go deeper |
|---|---|
| [Quick start](#get-started) | [Product spec](docs/spec-v1.md) |
| [Browser vs agent auth](#browser-vs-agent-auth) | [Environment variables](.env.example) |
| [Agent setup](docs/agents.md) | [AGENTS.md](AGENTS.md) |
| [Claude Desktop extension](extensions/claude-desktop/README.md) | [Web auth (Authelia)](docs/agents.md#web-dashboard-auth) |

## Development

```bash
make test          # backend + frontend tests
```

**Backend:** `cd backend`, create a venv, `pip install -e ".[dev]"`, `pytest -v`  
**Frontend:** `cd frontend`, `npm install`, `npm run dev`

Docker is the simplest way to run everything together.

## License

[Apache License 2.0](LICENSE)
