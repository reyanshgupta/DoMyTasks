"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import {
  filterDashboard,
  filterKanban,
  flattenDashboard,
  flattenKanban,
  normalizeViewPrefs,
} from "@/lib/viewFilters";
import type {
  DashboardResponse,
  KanbanResponse,
  TaskCard,
  TaskCreateInput,
  TaskDetail,
  TaskStatus,
  TaskUpdateInput,
  ViewPrefs,
  Workstream,
} from "@/lib/types";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardView } from "@/components/DashboardView";
import { KanbanBoard } from "@/components/KanbanBoard";
import { KanbanSkeleton, ListSkeleton } from "@/components/LoadingSkeleton";
import { LogoMark } from "@/components/LogoMark";
import { PageToolbar } from "@/components/PageToolbar";
import { SearchField } from "@/components/SearchField";
import { TaskForm } from "@/components/TaskForm";
import { TokenGate } from "@/components/TokenGate";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import { WorkstreamFormModal } from "@/components/WorkstreamFormModal";
import { MenuIcon, PlusIcon } from "@/components/icons";

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [autheliaEnabled, setAutheliaEnabled] = useState(false);
  const [workstreams, setWorkstreams] = useState<Workstream[]>([]);
  const [allTasks, setAllTasks] = useState<TaskCard[]>([]);
  const [prefs, setPrefs] = useState<ViewPrefs | null>(null);
  const [kanban, setKanban] = useState<KanbanResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDetail | null>(null);
  const [showWorkstreamForm, setShowWorkstreamForm] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadWorkstreams = useCallback(async () => {
    const ws = await api.listWorkstreams();
    setWorkstreams(ws);
    return ws;
  }, []);

  const loadView = useCallback(async (p: ViewPrefs) => {
    const normalized = normalizeViewPrefs(p);
    const params: Record<string, string | string[]> = {
      sort_by: normalized.sort_by,
      sort_dir: normalized.sort_dir,
    };
    if (normalized.workstream_ids?.length) {
      params.workstream_ids = normalized.workstream_ids;
    }

    if (normalized.view === "kanban") {
      params.hide_done = String(normalized.hide_done);
      const data = await api.getKanban(params);
      setKanban(data);
      setDashboard(null);
    } else {
      params.group_by = normalized.group_by;
      const data = await api.getDashboard(params);
      setDashboard(data);
      setKanban(null);
    }
    return normalized;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let p = prefs || normalizeViewPrefs(await api.getViewPrefs());
      if (p.group_by === "workstream") {
        p = normalizeViewPrefs(p);
        await api.setViewPrefs({ group_by: "flat" });
      }
      setPrefs(p);
      const [, tasks] = await Promise.all([loadWorkstreams(), api.listTasks()]);
      setAllTasks(tasks);
      const loaded = await loadView(p);
      setPrefs(loaded);
    } finally {
      setLoading(false);
    }
  }, [prefs, loadView, loadWorkstreams]);

  useEffect(() => {
    let cancelled = false;
    api.getAuthSession()
      .then((session) => {
        if (!cancelled) {
          setAuthed(session.authenticated);
          setAutheliaEnabled(session.authelia_enabled);
        }
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      })
      .finally(() => {
        if (!cancelled) setAuthChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      refresh().catch((e) => {
        if (!cancelled) setError(e.message);
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [authed, refresh]);

  useEffect(() => {
    if (!authed) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "n" && workstreams.length > 0) {
        e.preventDefault();
        setShowForm(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authed, workstreams.length]);

  async function updatePrefs(patch: Partial<ViewPrefs>) {
    setLoading(true);
    try {
      const updated = normalizeViewPrefs(await api.setViewPrefs(patch));
      setPrefs(updated);
      await loadView(updated);
    } finally {
      setLoading(false);
    }
  }

  async function handleTaskClick(id: string) {
    const task = await api.getTask(id);
    setEditingTask(task);
  }

  async function handleToggleTask(id: string, status: TaskStatus) {
    if (status === "done") {
      await api.moveTask(id, "todo");
    } else {
      await api.completeTask(id);
    }
    await refresh();
  }

  const allVisibleTasks = useMemo(
    () => (prefs?.view === "kanban" ? flattenKanban(kanban) : flattenDashboard(dashboard)),
    [dashboard, kanban, prefs?.view],
  );
  const filteredDashboard = useMemo(() => filterDashboard(dashboard, search), [dashboard, search]);
  const filteredKanban = useMemo(() => filterKanban(kanban, search), [kanban, search]);

  const stats = useMemo(() => {
    const tasks = allVisibleTasks;
    const done = tasks.filter((task) => task.status === "done").length;
    return {
      total: tasks.length,
      done,
      open: tasks.length - done,
    };
  }, [allVisibleTasks]);

  const globalStats = useMemo(() => {
    const done = allTasks.filter((task) => task.status === "done").length;
    const doing = allTasks.filter((task) => task.status === "doing").length;
    return {
      open: allTasks.length - done,
      doing,
    };
  }, [allTasks]);

  const selectedWorkstream =
    prefs?.view === "dashboard" &&
    prefs.group_by === "flat" &&
    prefs.workstream_ids?.length === 1
      ? workstreams.find((ws) => ws.id === prefs.workstream_ids?.[0])
      : null;

  const workstreamFilterCount = prefs?.workstream_ids?.length ?? 0;
  const showWorkstreamFilter =
    prefs?.view === "kanban" ||
    (prefs?.view === "dashboard" && prefs.group_by === "day");
  const filterSubtitle =
    showWorkstreamFilter && workstreamFilterCount > 0
      ? workstreamFilterCount === 1
        ? workstreams.find((ws) => ws.id === prefs?.workstream_ids?.[0])?.name
        : `${workstreamFilterCount} streams`
      : null;

  const pageTitle =
    prefs?.view === "kanban"
      ? "Board"
      : prefs?.group_by === "day"
        ? "Scheduled"
        : selectedWorkstream
          ? selectedWorkstream.name
          : "All Tasks";
  const pageAccent =
    selectedWorkstream?.color ||
    (prefs?.view === "kanban"
      ? "var(--purple)"
      : prefs?.group_by === "day"
        ? "var(--danger)"
        : "var(--accent)");

  const showInitialSkeleton =
    loading && workstreams.length > 0 && !kanban && !dashboard && prefs !== null;
  const contentRefreshing = loading && (kanban !== null || dashboard !== null);

  if (authChecking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg)] text-[var(--text)]">
        <LogoMark alt="DoMyTasks logo" className="h-12 w-12" />
      </div>
    );
  }

  if (!authed) {
    return (
      <TokenGate
        autheliaEnabled={autheliaEnabled}
        onAuthenticated={() => setAuthed(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300 lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
      <AppSidebar
        prefs={prefs}
        workstreams={workstreams}
        allTasks={allTasks}
        globalOpen={globalStats.open}
        globalDoing={globalStats.doing}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onUpdatePrefs={updatePrefs}
        onNewWorkstream={() => setShowWorkstreamForm(true)}
        onLogout={async () => {
          try {
            await api.logout();
          } finally {
            clearToken();
            setAuthed(false);
          }
        }}
      />

      <main className="min-w-0 px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-[960px]">
          <div className="animate-fade-up mb-4 lg:hidden">
            <ViewSwitcher prefs={prefs} onUpdate={updatePrefs} />
          </div>

          <div className="animate-fade-up mb-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] shadow-[var(--shadow-sm)] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:text-[var(--text)] active:translate-y-0 active:scale-95 lg:hidden"
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[32px] font-bold leading-tight tracking-normal text-[var(--text)] sm:text-[36px]">
                  {pageTitle}
                </h2>
                <div
                  className="mt-2 h-[3px] w-12 rounded-full"
                  style={{ backgroundColor: pageAccent }}
                />
                <p className="mt-2 text-[14px] font-medium text-[var(--text-muted)]">
                  {stats.open} open · {stats.done} done
                  {filterSubtitle ? ` · ${filterSubtitle}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                disabled={workstreams.length === 0}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[8px] px-3 text-[14px] font-semibold text-[var(--accent)] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[var(--accent-soft)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                <PlusIcon />
                <span className="hidden sm:inline">New Task</span>
                <kbd className="hidden rounded-[5px] bg-[var(--badge)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--text-muted)] sm:inline">
                  N
                </kbd>
              </button>
            </div>

            <SearchField value={search} onChange={setSearch} className="max-w-md" />
          </div>

          {prefs && (
            <PageToolbar
              prefs={prefs}
              workstreams={workstreams}
              showWorkstreamFilter={showWorkstreamFilter}
              onUpdate={updatePrefs}
            />
          )}

          {error && (
            <p className="animate-scale-in mb-4 rounded-[8px] border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-[13px] font-medium text-[var(--danger)]">
              {error}
            </p>
          )}

          {workstreams.length === 0 && (
            <div className="animate-fade-up stagger-2 mt-12 max-w-md">
              <LogoMark alt="DoMyTasks logo" className="mb-4 h-14 w-14" />
              <p className="text-[18px] font-semibold text-[var(--text)]">No workstreams yet</p>
              <button
                type="button"
                onClick={() => setShowWorkstreamForm(true)}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 text-[14px] font-semibold text-white shadow-[var(--shadow-sm)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)] active:translate-y-0 active:scale-[0.98]"
              >
                <PlusIcon />
                Create Workstream
              </button>
            </div>
          )}

          <div className={contentRefreshing ? "opacity-60 transition-opacity duration-200" : ""}>
            {showInitialSkeleton && prefs?.view === "kanban" && <KanbanSkeleton />}
            {showInitialSkeleton && prefs?.view === "dashboard" && <ListSkeleton />}

            {workstreams.length > 0 && filteredKanban && prefs && !showInitialSkeleton && (
              <KanbanBoard
                board={filteredKanban}
                sortBy={prefs.sort_by}
                onMove={async (id, status) => {
                  await api.moveTask(id, status);
                  await refresh();
                }}
                onReorder={async (ids) => {
                  await api.reorderTasks(ids);
                  await refresh();
                }}
                onTaskClick={handleTaskClick}
                onToggleTask={handleToggleTask}
                searchQuery={search}
                onClearSearch={() => setSearch("")}
              />
            )}

            {workstreams.length > 0 && filteredDashboard && !showInitialSkeleton && (
              <DashboardView
                data={filteredDashboard}
                onTaskClick={handleTaskClick}
                onToggleTask={handleToggleTask}
                searchQuery={search}
                onClearSearch={() => setSearch("")}
              />
            )}
          </div>
        </div>
      </main>

      {showForm && workstreams.length > 0 && (
        <TaskForm
          workstreams={workstreams}
          onSubmit={async (data) => {
            await api.createTask(data as TaskCreateInput);
            setShowForm(false);
            await refresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingTask && (
        <TaskForm
          workstreams={workstreams}
          initial={editingTask}
          onSubmit={async (data) => {
            await api.updateTask(editingTask.id, data as TaskUpdateInput);
            setEditingTask(null);
            await refresh();
          }}
          onCancel={() => setEditingTask(null)}
          onDelete={async () => {
            await api.deleteTask(editingTask.id);
            setEditingTask(null);
            await refresh();
          }}
        />
      )}

      {showWorkstreamForm && (
        <WorkstreamFormModal
          name={newWsName}
          onNameChange={setNewWsName}
          onCancel={() => setShowWorkstreamForm(false)}
          onSubmit={async () => {
            await api.createWorkstream(newWsName);
            setNewWsName("");
            setShowWorkstreamForm(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
