"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Workstream } from "@/lib/types";

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function filterLabel(workstreams: Workstream[], selectedIds: string[] | null): string {
  if (!selectedIds?.length) return "All streams";
  if (selectedIds.length === 1) {
    const ws = workstreams.find((w) => w.id === selectedIds[0]);
    return ws?.name ?? "1 stream";
  }
  return `${selectedIds.length} streams`;
}

export function WorkstreamFilter({
  workstreams,
  selectedIds,
  onChange,
}: {
  workstreams: Workstream[];
  selectedIds: string[] | null;
  onChange: (ids: string[] | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(
    () => new Set(selectedIds ?? []),
    [selectedIds],
  );

  const label = filterLabel(workstreams, selectedIds);
  const hasFilter = (selectedIds?.length ?? 0) > 0;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectAll() {
    onChange(null);
  }

  function toggleWorkstream(id: string) {
    const current = selectedIds ?? [];
    if (current.includes(id)) {
      const next = current.filter((wsId) => wsId !== id);
      onChange(next.length ? next : null);
    } else {
      onChange([...current, id]);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-[13px] shadow-[var(--shadow-sm)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px hover:border-[var(--border-strong)]"
      >
        <span className="text-[12px] font-medium text-[var(--text-muted)]">Streams</span>
        <span
          className={`max-w-[140px] truncate text-[13px] font-semibold ${
            hasFilter ? "text-[var(--accent)]" : "text-[var(--text)]"
          }`}
        >
          {label}
        </span>
        <span className="text-[var(--text-muted)]">
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Filter by workstream"
          aria-multiselectable="true"
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[220px] max-w-[min(280px,calc(100vw-2rem))] rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] py-1 shadow-[var(--shadow-md)]"
        >
          <button
            type="button"
            role="option"
            aria-selected={!hasFilter}
            onClick={selectAll}
            className={`flex h-9 w-full items-center gap-2 px-3 text-left text-[13px] font-medium transition-colors hover:bg-[var(--sidebar-hover)] ${
              !hasFilter ? "text-[var(--accent)]" : "text-[var(--text)]"
            }`}
          >
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border border-[var(--border-strong)] bg-[var(--surface)]">
              {!hasFilter && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path
                    d="M2 5.2 4.1 7.3 8 3.4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            All streams
          </button>

          <div className="my-1 h-px bg-[var(--border)]" />

          {workstreams.map((ws) => {
            const checked = selectedSet.has(ws.id);
            return (
              <button
                key={ws.id}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggleWorkstream(ws.id)}
                className="flex h-9 w-full items-center gap-2 px-3 text-left text-[13px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--sidebar-hover)]"
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border ${
                    checked
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border-strong)] bg-[var(--surface)]"
                  }`}
                >
                  {checked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path
                        d="M2 5.2 4.1 7.3 8 3.4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: ws.color || "#8e8e93" }}
                />
                <span className="min-w-0 flex-1 truncate">{ws.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
