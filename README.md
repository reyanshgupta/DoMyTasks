# DoMyTasks

Agent-first task tracker — one Docker container on port 3603. Humans and agents share the same service layer.

## Quick start

```bash
cp .env.example .env
# Edit .env and set DOMYTASKS_TOKEN

docker compose up --build
```

Open http://localhost:3603 and enter your bearer token.

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
