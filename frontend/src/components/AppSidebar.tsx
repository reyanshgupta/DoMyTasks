"use client";

import { useEffect } from "react";
import type { TaskCard, ViewPrefs, Workstream } from "@/lib/types";
import { countByWorkstream } from "@/lib/viewFilters";
import { LogoMark } from "@/components/LogoMark";
import { SidebarItem } from "@/components/SidebarItem";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BoardIcon,
  CalendarIcon,
  InboxIcon,
  LogOutIcon,
  PlusIcon,
} from "@/components/icons";

function SidebarContent({
  prefs,
  workstreams,
  allTasks,
  globalOpen,
  globalDoing,
  onUpdatePrefs,
  onNewWorkstream,
  onLogout,
  onNavigate,
}: {
  prefs: ViewPrefs | null;
  workstreams: Workstream[];
  allTasks: TaskCard[];
  globalOpen: number;
  globalDoing: number;
  onUpdatePrefs: (patch: Partial<ViewPrefs>) => void;
  onNewWorkstream: () => void;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  function navigate(patch: Partial<ViewPrefs>) {
    onUpdatePrefs(patch);
    onNavigate?.();
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3 px-1">
        <LogoMark alt="DoMyTasks logo" className="h-9 w-9" />
        <div className="min-w-0">
          <h1 className="truncate text-[16px] font-semibold leading-tight">DoMyTasks</h1>
          <p className="text-[12px] font-medium text-[var(--text-muted)]">{globalOpen} open</p>
        </div>
        <ThemeToggle variant="compact" className="ml-auto" />
        <button
          type="button"
          onClick={onLogout}
          className="grid h-8 w-8 place-items-center rounded-[9px] text-[var(--text-muted)] transition-[background-color,color,transform] duration-200 hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-secondary)] hover:-translate-y-px active:translate-y-0 active:scale-95"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOutIcon />
        </button>
      </div>

      <nav className="space-y-1">
        <SidebarItem
          active={
            prefs?.view === "dashboard" &&
            !prefs.workstream_ids?.length &&
            prefs.group_by === "flat"
          }
          icon={<InboxIcon />}
          label="All Tasks"
          count={globalOpen}
          onClick={() =>
            navigate({ view: "dashboard", group_by: "flat", workstream_ids: null })
          }
        />
        <SidebarItem
          active={prefs?.view === "dashboard" && prefs.group_by === "day"}
          icon={<CalendarIcon />}
          label="Scheduled"
          onClick={() =>
            navigate({
              view: "dashboard",
              group_by: "day",
              sort_by: "due_at",
              sort_dir: "asc",
            })
          }
        />
        <SidebarItem
          active={prefs?.view === "kanban"}
          icon={<BoardIcon />}
          label="Board"
          count={globalDoing}
          onClick={() => navigate({ view: "kanban" })}
        />
      </nav>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[11px] font-semibold uppercase text-[var(--text-muted)]">
            Workstreams
          </p>
          <button
            type="button"
            onClick={onNewWorkstream}
            className="grid h-7 w-7 place-items-center rounded-[8px] text-[var(--accent)] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[var(--accent-soft)] active:translate-y-0 active:scale-95"
            aria-label="New workstream"
            title="New workstream"
          >
            <PlusIcon />
          </button>
        </div>
        <div className="space-y-1">
          {workstreams.map((ws) => (
            <SidebarItem
              key={ws.id}
              active={
                prefs?.view === "dashboard" &&
                prefs.group_by === "flat" &&
                prefs.workstream_ids?.length === 1 &&
                prefs.workstream_ids[0] === ws.id
              }
              color={ws.color || "#8e8e93"}
              label={ws.name}
              count={countByWorkstream(allTasks, ws.id)}
              onClick={() =>
                navigate({ view: "dashboard", group_by: "flat", workstream_ids: [ws.id] })
              }
            />
          ))}
          {workstreams.length === 0 && (
            <p className="px-2 py-2 text-[13px] text-[var(--text-muted)]">No workstreams yet</p>
          )}
        </div>
      </div>
    </>
  );
}

export function AppSidebar({
  prefs,
  workstreams,
  allTasks,
  globalOpen,
  globalDoing,
  open,
  onOpenChange,
  onUpdatePrefs,
  onNewWorkstream,
  onLogout,
}: {
  prefs: ViewPrefs | null;
  workstreams: Workstream[];
  allTasks: TaskCard[];
  globalOpen: number;
  globalDoing: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdatePrefs: (patch: Partial<ViewPrefs>) => void;
  onNewWorkstream: () => void;
  onLogout: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const contentProps = {
    prefs,
    workstreams,
    allTasks,
    globalOpen,
    globalDoing,
    onUpdatePrefs,
    onNewWorkstream,
    onLogout,
    onNavigate: () => onOpenChange(false),
  };

  return (
    <>
      <aside className="animate-sidebar-in hidden border-r border-[var(--border)] bg-[var(--sidebar)] px-4 py-4 backdrop-blur-xl transition-colors duration-300 lg:sticky lg:top-0 lg:block lg:h-screen lg:px-4">
        <SidebarContent {...contentProps} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="animate-overlay-in absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <aside className="animate-sidebar-in absolute left-0 top-0 h-full w-[min(300px,88vw)] overflow-y-auto border-r border-[var(--border)] bg-[var(--sidebar)] px-4 py-4 shadow-[var(--shadow-lg)]">
            <SidebarContent {...contentProps} />
          </aside>
        </div>
      )}
    </>
  );
}
