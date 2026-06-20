# DoMyTasks

A small task tracker you run yourself. Add tasks in the browser, or tell Claude to add them for you — same list either way.

Each task has a title and a **context** field: the notes, links, and details someone (or something) needs to actually do the work. That's the whole idea. No sprints, no teams, no workflow engine.

## Run it

```bash
cp .env.example .env
# set DOMYTASKS_TOKEN to something secret

docker compose up --build
```

Open http://localhost:3603. Paste your token once to log in — after that the browser keeps a session cookie.

Your tasks live in `./data/` on disk.

## What you get

- **Kanban board** — drag tasks between todo, doing, and done
- **Dashboard** — grouped by day, workstream, or flat list
- **Workstreams** — you create these yourself (Engineering, Home, whatever)
- **Claude** — create, update, and finish tasks by talking to an agent

## Claude

The easiest path is the Claude Desktop extension:

```bash
cd extensions/claude-desktop
npm run pack
```

Install `dist/domytasks.mcpb` in Claude Desktop (Settings → Extensions). Point it at `http://localhost:3603` and paste the same token from your `.env`.

For Claude on the web, Hermes, Cursor, or anything else — see [docs/agents.md](docs/agents.md).

## Behind a login page (optional)

If you put DoMyTasks on a VPS behind [Authelia](https://www.authelia.com/), you can skip the token paste in the browser and let Authelia handle login instead:

```env
DOMYTASKS_AUTHELIA_ENABLED=true
DOMYTASKS_AUTHELIA_TRUSTED_PROXIES=127.0.0.1/32
```

Set `DOMYTASKS_WEB_SESSION_SECURE=true` when you're on HTTPS. Details are in `.env.example`.

## Development

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
export DOMYTASKS_TOKEN=dev-token
export DOMYTASKS_DB_PATH=./data/domytasks.db
pytest -v
uvicorn domytasks.main:app --reload --port 3603
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Docker is the simplest way to run everything together locally.

## Docs

- [docs/agents.md](docs/agents.md) — connecting Claude and other agents
- [docs/spec-v1.md](docs/spec-v1.md) — product spec
