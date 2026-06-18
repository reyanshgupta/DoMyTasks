# DoMyTasks — Claude Desktop Extension

One-click MCPB extension that connects Claude Desktop to your DoMyTasks server.

## Prerequisites

1. DoMyTasks running (`docker compose up` from repo root)
2. Your `DOMYTASKS_TOKEN` from `.env`

## Build the extension

```bash
cd extensions/claude-desktop
npm run pack
```

Creates `dist/domytasks.mcpb` at the repo root.

## Install

1. Open **Claude Desktop** → **Settings** → **Extensions** → **Advanced settings** → **Install Extension…**
2. Select `dist/domytasks.mcpb` (or double-click the file)
3. Enter:
   - **Server URL:** `http://localhost:3603`
   - **Bearer token:** your `DOMYTASKS_TOKEN`
4. Enable the extension for new chats

## Troubleshooting

- **Server disconnected right after connecting:** Reinstall the latest `dist/domytasks.mcpb` (v1.0.2+). Older builds used `mcp-remote`, which expects OAuth and crashes against DoMyTasks bearer auth.
- **Connection refused:** Start DoMyTasks first (`docker compose up -d` from repo root).
- **Unauthorized:** Bearer token must match `DOMYTASKS_TOKEN` in your `.env` exactly.

Ask Claude: *"List my DoMyTasks workstreams and create a test task."*

See [docs/agents.md](../../docs/agents.md) for full agent documentation.
