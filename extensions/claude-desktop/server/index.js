#!/usr/bin/env node
/**
 * Stdio ↔ Streamable HTTP bridge for DoMyTasks (bearer auth only, no OAuth).
 */
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

function normalizeMcpUrl(serverUrl) {
  const base = serverUrl.trim().replace(/\/+$/, "");
  const mcpPath = base.endsWith("/mcp") ? base : `${base}/mcp`;
  return mcpPath.endsWith("/") ? mcpPath : `${mcpPath}/`;
}

function proxyTransports(local, remote) {
  let localClosed = false;
  let remoteClosed = false;

  local.onmessage = (message) => {
    remote.send(message).catch((err) => {
      process.stderr.write(`DoMyTasks remote error: ${err}\n`);
    });
  };

  remote.onmessage = (message) => {
    local.send(message).catch((err) => {
      process.stderr.write(`DoMyTasks local error: ${err}\n`);
    });
  };

  local.onclose = () => {
    if (remoteClosed) return;
    localClosed = true;
    remote.close().catch(() => {});
  };

  remote.onclose = () => {
    if (localClosed) return;
    remoteClosed = true;
    local.close().catch(() => {});
  };

  local.onerror = (err) => {
    process.stderr.write(`DoMyTasks stdio error: ${err}\n`);
  };

  remote.onerror = (err) => {
    process.stderr.write(`DoMyTasks HTTP error: ${err}\n`);
  };
}

async function main() {
  const serverUrl = process.env.DOMYTASKS_SERVER_URL?.trim();
  const token = process.env.DOMYTASKS_TOKEN?.trim();

  if (!serverUrl) {
    process.stderr.write(
      "DoMyTasks: set Server URL in extension settings (e.g. http://localhost:3603).\n",
    );
    process.exit(1);
  }

  if (!token) {
    process.stderr.write(
      "DoMyTasks: set Bearer token in extension settings (same as DOMYTASKS_TOKEN).\n",
    );
    process.exit(1);
  }

  const mcpUrl = normalizeMcpUrl(serverUrl);
  const local = new StdioServerTransport();
  const remote = new StreamableHTTPClientTransport(new URL(mcpUrl), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  proxyTransports(local, remote);

  await remote.start();
  await local.start();

  process.stderr.write(`DoMyTasks: connected to ${mcpUrl}\n`);
}

main().catch((err) => {
  process.stderr.write(`DoMyTasks: fatal: ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
