"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
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
import { DashboardView } from "@/components/DashboardView";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LogoMark } from "@/components/LogoMark";
import { TaskForm } from "@/components/TaskForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TokenGate } from "@/components/TokenGate";

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="m11.1 11.1 3 3M7.1 12.2a5.1 5.1 0 1 0 0-10.2 5.1 5.1 0 0 0 0 10.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.2 4.2h11.6l1.1 5.2v4.4a1.5 1.5 0 0 1-1.5 1.5H3.6a1.5 1.5 0 0 1-1.5-1.5V9.4l1.1-5.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M2.2 9.4h4.1c.5 0 .8.3 1 .8.3.8.9 1.2 1.7 1.2s1.4-.4 1.7-1.2c.2-.5.5-.8 1-.8h4.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.5" y="3.8" width="13" height="11.7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.8 2.5v2.6M12.2 2.5v2.6M2.8 7.2h12.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.5" y="3" width="3.5" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7.2" y="3" width="3.5" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.9" y="3" width="3.5" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidebarItem({
  active,
  icon,
  label,
  count,
  color,
  onClick,
}: {
  active: boolean;
  icon?: React.ReactNode;
  label: string;
  count?: number;
  color?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 w-full items-center gap-2 rounded-[8px] px-2.5 text-left text-[14px] font-medium transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:translate-x-0.5 active:scale-[0.99] ${
        active
          ? "bg-[var(--sidebar-active)] text-[var(--text)] shadow-[var(--shadow-sm)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text)]"
      }`}
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center text-[var(--text-muted)]">
        {color ? (
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        ) : (
          icon
        )}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-[var(--badge)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--text-muted)] transition-colors">
          {count}
        </span>
      )}
    </button>
  );
}

function QuietSelect({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-[13px] shadow-[var(--shadow-sm)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px hover:border-[var(--border-strong)]">
      <span className="text-[12px] font-medium text-[var(--text-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer border-0 bg-transparent py-0 pl-0 pr-5 text-[13px] font-semibold text-[var(--text)] outline-none"
      >
        {children}
      </select>
    </label>
  );
}

function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[8px] border border-transparent bg-[var(--surface-strong)] px-3 text-[var(--text-muted)] transition-[background-color,border-color,box-shadow] duration-200 focus-within:border-[var(--accent)] focus-within:bg-[var(--surface)] focus-within:shadow-[var(--shadow-sm)]">
      <SearchIcon />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
      />
    </label>
  );
}

function flattenDashboard(data: DashboardResponse | null): TaskCard[] {
  if (!data) return [];
  if (data.tasks) return data.tasks;
  return data.groups?.flatMap((group) => group.tasks) || [];
}

function flattenKanban(data: KanbanResponse | null): TaskCard[] {
  return data?.columns.flatMap((column) => column.tasks) || [];
}

function filterDashboard(data: DashboardResponse | null, query: string): DashboardResponse | null {
  if (!data || !query.trim()) return data;
  const q = query.trim().toLowerCase();
  const matches = (task: TaskCard) =>
    task.title.toLowerCase().includes(q) ||
    task.workstream.name.toLowerCase().includes(q) ||
    task.status.toLowerCase().includes(q);

  if (data.tasks) {
    return { ...data, tasks: data.tasks.filter(matches) };
  }

  return {
    ...data,
    groups: data.groups?.map((group) => ({
      ...group,
      tasks: group.tasks.filter(matches),
    })),
  };
}

function filterKanban(data: KanbanResponse | null, query: string): KanbanResponse | null {
  if (!data || !query.trim()) return data;
  const q = query.trim().toLowerCase();
  return {
    ...data,
    columns: data.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) =>
        task.title.toLowerCase().includes(q) ||
        task.workstream.name.toLowerCase().includes(q) ||
        task.status.toLowerCase().includes(q),
      ),
    })),
  };
}

function countByWorkstream(tasks: TaskCard[], workstreamId: string): number {
  return tasks.filter((task) => task.workstream.id === workstreamId && task.status !== "done").length;
}

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [autheliaEnabled, setAutheliaEnabled] = useState(false);
  const [workstreams, setWorkstreams] = useState<Workstream[]>([]);
  const [allTasks, setAllTasks] = useState<TaskCard[]>([]);
  const [prefs, setPrefs] = useState<ViewPrefs | null>(null);
  const [kanban, setKanban] = useState<KanbanResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
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
    const params: Record<string, string | string[]> = {
      sort_by: p.sort_by,
      sort_dir: p.sort_dir,
    };
    if (p.workstream_ids?.length) {
      params.workstream_ids = p.workstream_ids;
    }

    if (p.view === "kanban") {
      params.hide_done = String(p.hide_done);
      const data = await api.getKanban(params);
      setKanban(data);
      setDashboard(null);
    } else {
      params.group_by = p.group_by;
      const data = await api.getDashboard(params);
      setDashboard(data);
      setKanban(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const p = prefs || (await api.getViewPrefs());
    setPrefs(p);
    const [, tasks] = await Promise.all([
      loadWorkstreams(),
      api.listTasks(),
    ]);
    setAllTasks(tasks);
    await loadView(p);
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
    const updated = await api.setViewPrefs(patch);
    setPrefs(updated);
    await loadView(updated);
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
    const doing = tasks.filter((task) => task.status === "doing").length;
    return {
      total: tasks.length,
      done,
      doing,
      open: tasks.length - done,
    };
  }, [allVisibleTasks]);

  const globalStats = useMemo(() => {
    const done = allTasks.filter((task) => task.status === "done").length;
    const doing = allTasks.filter((task) => task.status === "doing").length;
    return {
      total: allTasks.length,
      done,
      doing,
      open: allTasks.length - done,
    };
  }, [allTasks]);

  const selectedWorkstream = prefs?.workstream_ids?.[0]
    ? workstreams.find((ws) => ws.id === prefs.workstream_ids?.[0])
    : null;

  const pageTitle =
    prefs?.view === "kanban"
      ? "Board"
      : selectedWorkstream
        ? selectedWorkstream.name
        : prefs?.group_by === "day"
          ? "Scheduled"
          : "All Tasks";
  const pageAccent =
    selectedWorkstream?.color ||
    (prefs?.view === "kanban"
      ? "var(--purple)"
      : prefs?.group_by === "day"
        ? "var(--danger)"
        : "var(--accent)");

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
      <aside className="animate-sidebar-in border-b border-[var(--border)] bg-[var(--sidebar)] px-4 py-4 backdrop-blur-xl transition-colors duration-300 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-4">
        <div className="mb-4 flex items-center gap-3 px-1">
          <LogoMark alt="DoMyTasks logo" className="h-9 w-9" />
          <div className="min-w-0">
            <h1 className="truncate text-[16px] font-semibold leading-tight">DoMyTasks</h1>
            <p className="text-[12px] font-medium text-[var(--text-muted)]">
              {globalStats.open} open
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await api.logout();
              } finally {
                clearToken();
                setAuthed(false);
              }
            }}
            className="ml-auto grid h-8 w-8 place-items-center rounded-[9px] text-[var(--text-muted)] transition-[background-color,color,transform] duration-200 hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-secondary)] hover:-translate-y-px active:translate-y-0 active:scale-95"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOutIcon />
          </button>
        </div>

        <div className="mb-4 px-1">
          <ThemeToggle className="w-full" />
        </div>

        <div className="mb-4">
          <SearchField value={search} onChange={setSearch} />
        </div>

        <nav className="space-y-1">
          <SidebarItem
            active={prefs?.view === "dashboard" && !prefs.workstream_ids?.length && prefs.group_by === "flat"}
            icon={<InboxIcon />}
            label="All Tasks"
            count={globalStats.open}
            onClick={() => updatePrefs({ view: "dashboard", group_by: "flat", workstream_ids: null })}
          />
          <SidebarItem
            active={prefs?.view === "dashboard" && !prefs.workstream_ids?.length && prefs.group_by === "day"}
            icon={<CalendarIcon />}
            label="Scheduled"
            onClick={() => updatePrefs({ view: "dashboard", group_by: "day", workstream_ids: null, sort_by: "due_at", sort_dir: "asc" })}
          />
          <SidebarItem
            active={prefs?.view === "kanban"}
            icon={<BoardIcon />}
            label="Board"
            count={globalStats.doing}
            onClick={() => updatePrefs({ view: "kanban" })}
          />
        </nav>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[11px] font-semibold uppercase text-[var(--text-muted)]">
              Workstreams
            </p>
            <button
              type="button"
              onClick={() => setShowWorkstreamForm(true)}
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
                active={prefs?.view === "dashboard" && prefs.workstream_ids?.[0] === ws.id}
                color={ws.color || "#8e8e93"}
                label={ws.name}
                count={countByWorkstream(allTasks, ws.id)}
                onClick={() => updatePrefs({ view: "dashboard", group_by: "flat", workstream_ids: [ws.id] })}
              />
            ))}
            {workstreams.length === 0 && (
              <p className="px-2 py-2 text-[13px] text-[var(--text-muted)]">No workstreams yet</p>
            )}
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-[960px]">
          <div className="animate-fade-up mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2
                className="truncate text-[38px] font-bold leading-tight tracking-normal sm:text-[46px]"
                style={{ color: pageAccent }}
              >
                {pageTitle}
              </h2>
              <p className="mt-1 text-[14px] font-medium text-[var(--text-muted)]">
                {stats.open} open · {stats.done} done
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              disabled={workstreams.length === 0}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[8px] px-3 text-[14px] font-semibold text-[var(--accent)] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[var(--accent-soft)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              <PlusIcon />
              New Task
            </button>
          </div>

          <div className="animate-fade-up stagger-1 mb-5 flex flex-wrap items-center gap-2">
            <QuietSelect
              label="Sort"
              value={prefs?.sort_by || "due_at"}
              onChange={(v) => updatePrefs({ sort_by: v as ViewPrefs["sort_by"] })}
            >
              <option value="due_at">Due date</option>
              <option value="priority">Priority</option>
              <option value="updated_at">Updated</option>
              <option value="manual">Manual</option>
            </QuietSelect>
            {prefs?.view === "dashboard" && (
              <QuietSelect
                label="View"
                value={prefs.group_by}
                onChange={(v) => updatePrefs({ group_by: v as ViewPrefs["group_by"] })}
              >
                <option value="flat">List</option>
                <option value="day">Date</option>
                <option value="workstream">Streams</option>
              </QuietSelect>
            )}
            {prefs?.view === "kanban" && (
              <button
                type="button"
                aria-pressed={prefs.hide_done}
                onClick={() => updatePrefs({ hide_done: !prefs.hide_done })}
                className={`inline-flex h-9 items-center gap-2 rounded-[8px] border px-3 text-[13px] font-semibold shadow-[var(--shadow-sm)] transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] ${
                  prefs.hide_done
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    prefs.hide_done ? "bg-[var(--accent)]" : "bg-[var(--text-muted)]"
                  }`}
                />
                Hide Done
              </button>
            )}
          </div>

          {error && (
            <p className="animate-scale-in mb-4 rounded-[8px] border border-[rgba(255,59,48,0.24)] bg-[var(--danger-soft)] px-4 py-3 text-[13px] font-medium text-[var(--danger)]">
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

          {workstreams.length > 0 && filteredKanban && prefs && (
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
            />
          )}

          {workstreams.length > 0 && filteredDashboard && (
            <DashboardView
              data={filteredDashboard}
              onTaskClick={handleTaskClick}
              onToggleTask={handleToggleTask}
            />
          )}
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
        <div
          className="animate-overlay-in fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setShowWorkstreamForm(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await api.createWorkstream(newWsName);
              setNewWsName("");
              setShowWorkstreamForm(false);
              await refresh();
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-dialog-in w-full max-w-sm rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-lg)]"
          >
            <h2 className="mb-5 text-[20px] font-semibold text-[var(--text)]">
              New Workstream
            </h2>
            <label className="mb-5 block text-[13px] font-semibold text-[var(--text-secondary)]">
              Name
              <input
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="Personal, Work, Side project"
                autoFocus
                className="mt-1.5 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-[15px] text-[var(--text)] outline-none transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--surface)]"
                required
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!newWsName.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[var(--accent)] px-5 text-[14px] font-semibold text-white shadow-[var(--shadow-sm)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                <PlusIcon />
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowWorkstreamForm(false)}
                className="h-10 rounded-[8px] px-4 text-[14px] font-semibold text-[var(--text-secondary)] transition-[background-color,color,transform] duration-200 hover:bg-[var(--surface-muted)] hover:text-[var(--text)] active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
