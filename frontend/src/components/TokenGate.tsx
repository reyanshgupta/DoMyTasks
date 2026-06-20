"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { LogoMark } from "@/components/LogoMark";
import { ThemeToggle } from "@/components/ThemeToggle";

export function TokenGate({
  autheliaEnabled = false,
  onAuthenticated,
}: {
  autheliaEnabled?: boolean;
  onAuthenticated: () => void;
}) {
  const [token, setTokenValue] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) {
      setError("Token is required");
      return;
    }
    try {
      await api.login(token.trim());
      clearToken();
      onAuthenticated();
    } catch {
      clearToken();
      setError("Invalid token");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg)] p-4 transition-colors duration-300">
      <div className="absolute right-4 top-4 z-10 w-[142px]">
        <ThemeToggle className="w-full" />
      </div>
      <form
        onSubmit={handleSubmit}
        className="animate-dialog-in w-full max-w-md overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
      >
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] px-7 py-6">
          <LogoMark alt="DoMyTasks logo" className="mb-4 h-12 w-12" />
          <h1 className="text-[22px] font-bold leading-tight text-[var(--text)]">
            DoMyTasks
          </h1>
          <p className="mt-1 text-[13px] font-medium text-[var(--text-muted)]">
            {autheliaEnabled
              ? "Use your Authelia URL when available, or enter a token for direct access."
              : "Enter your token once. A session cookie keeps you signed in."}
          </p>
        </div>

        <div className="px-7 py-6">
          <label className="mb-4 block text-[13px] font-semibold text-[var(--text-secondary)]">
            Bearer token
            <input
              type="password"
              value={token}
              onChange={(e) => setTokenValue(e.target.value)}
              placeholder="Token"
              autoFocus
              className="mt-1.5 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-[var(--text)] outline-none transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            />
          </label>
          {error && (
            <p className="animate-scale-in mb-4 rounded-[8px] border border-[rgba(255,59,48,0.24)] bg-[var(--danger-soft)] px-3 py-2 text-[13px] font-medium text-[var(--danger)]">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="h-10 w-full rounded-[8px] bg-[var(--accent)] px-4 text-[14px] font-semibold text-white shadow-[var(--shadow-sm)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)] active:translate-y-0 active:scale-[0.99]"
          >
            Connect
          </button>
        </div>
      </form>
    </div>
  );
}
