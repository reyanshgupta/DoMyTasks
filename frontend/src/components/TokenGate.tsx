"use client";

import { useState } from "react";
import { setToken } from "@/lib/auth";

export function TokenGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [token, setTokenValue] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) {
      setError("Token is required");
      return;
    }
    setToken(token.trim());
    try {
      const res = await fetch("/api/settings/view", {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (!res.ok) throw new Error("Invalid token");
      onAuthenticated();
    } catch {
      setError("Invalid token");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
      >
        <h1 className="mb-2 text-2xl font-semibold text-white">DoMyTasks</h1>
        <p className="mb-6 text-sm text-slate-400">
          Enter your bearer token to connect.
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setTokenValue(e.target.value)}
          placeholder="Bearer token"
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-blue-500"
        />
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
        >
          Connect
        </button>
      </form>
    </div>
  );
}
