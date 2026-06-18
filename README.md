# DoMyTasks

Agent-first task tracker — one Docker container on port 3603. Humans and agents share the same service layer.

## Quick start

```bash
cp .env.example .env
# Edit .env and set DOMYTASKS_TOKEN

docker compose up --build
```

Open http://localhost:3603 and enter your bearer token once. The web dashboard
stores a signed `HttpOnly` session cookie; MCP and scripts still use the bearer
token.

### Web auth options

The dashboard supports two browser-friendly auth paths:

- **Token login:** paste `DOMYTASKS_TOKEN` once in the web UI. DoMyTasks sets a
  signed session cookie, so refreshes do not need the token again.
- **Authelia trusted headers:** put DoMyTasks behind an Authelia-protected
  reverse proxy and enable:

```env
DOMYTASKS_AUTHELIA_ENABLED=true
DOMYTASKS_AUTHELIA_TRUSTED_PROXIES=127.0.0.1/32
```

Forward Authelia's `Remote-User` header to DoMyTasks only from the trusted proxy.
Set `DOMYTASKS_WEB_SESSION_SECURE=true` when serving DoMyTasks over HTTPS.

## Development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
export DOMYTASKS_TOKEN=dev-token
export DOMYTASKS_DB_PATH=./data/domytasks.db
pytest -v
uvicorn domytasks.main:app --reload --port 3603
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For local dev, proxy API calls or run the full stack via Docker.

## Architecture

- **MCP** (`/mcp`) — agents create, query, claim, and complete tasks
- **REST** (`/api`) — web UI and integrations
- **SQLite** (`/data/domytasks.db`) — single source of truth

See [docs/spec-v1.md](docs/spec-v1.md) for the full product spec.

## Agent setup

See [docs/agents.md](docs/agents.md).

### Claude Desktop extension (recommended)

Build and install the one-click `.mcpb` extension:

```bash
cd extensions/claude-desktop
npm run pack
# Install dist/domytasks.mcpb via Claude Desktop → Settings → Extensions
```
