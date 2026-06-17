"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { clearToken, hasToken } from "@/lib/auth";
import type {
  DashboardResponse,
  KanbanResponse,
  TaskCreateInput,
  TaskDetail,
  TaskUpdateInput,
  ViewPrefs,
  Workstream,
} from "@/lib/types";
import { DashboardView } from "@/components/DashboardView";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TaskForm } from "@/components/TaskForm";
import { TokenGate } from "@/components/TokenGate";

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [workstreams, setWorkstreams] = useState<Workstream[]>([]);
  const [prefs, setPrefs] = useState<ViewPrefs | null>(null);
  const [kanban, setKanban] = useState<KanbanResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDetail | null>(null);
  const [showWorkstreamForm, setShowWorkstreamForm] = useState(false);
  const [newWsName, setNewWsName] = useState("");
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
    await loadWorkstreams();
    await loadView(p);
  }, [prefs, loadView, loadWorkstreams]);

  useEffect(() => {
    if (hasToken()) setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    refresh().catch((e) => setError(e.message));
  }, [authed, refresh]);

  async function updatePrefs(patch: Partial<ViewPrefs>) {
    const updated = await api.setViewPrefs(patch);
    setPrefs(updated);
    await loadView(updated);
  }

  async function handleTaskClick(id: string) {
    const task = await api.getTask(id);
    setEditingTask(task);
  }

  if (!authed) {
    return <TokenGate onAuthenticated={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold">DoMyTasks</h1>

          <select
            value={prefs?.view || "kanban"}
            onChange={(e) =>
              updatePrefs({ view: e.target.value as ViewPrefs["view"] })
            }
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
          >
            <option value="kanban">Kanban</option>
            <option value="dashboard">Dashboard</option>
          </select>

          {prefs?.view === "dashboard" && (
            <select
              value={prefs.group_by}
              onChange={(e) =>
                updatePrefs({
                  group_by: e.target.value as ViewPrefs["group_by"],
                })
              }
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
            >
              <option value="day">Day</option>
              <option value="workstream">Workstream</option>
              <option value="flat">Flat</option>
            </select>
          )}

          <select
            value={prefs?.sort_by || "priority"}
            onChange={(e) =>
              updatePrefs({ sort_by: e.target.value as ViewPrefs["sort_by"] })
            }
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
          >
            <option value="priority">Priority</option>
            <option value="due_at">Due date</option>
            <option value="updated_at">Updated</option>
            <option value="manual">Manual</option>
          </select>

          <select
            value={prefs?.workstream_ids?.[0] || ""}
            onChange={(e) =>
              updatePrefs({
                workstream_ids: e.target.value ? [e.target.value] : null,
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
          >
            <option value="">All workstreams</option>
            {workstreams.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowForm(true)}
            disabled={workstreams.length === 0}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-40"
          >
            + New
          </button>

          <button
            onClick={() => setShowWorkstreamForm(true)}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            + Workstream
          </button>

          <button
            onClick={() => {
              clearToken();
              setAuthed(false);
            }}
            className="ml-auto text-sm text-slate-500 hover:text-slate-300"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        {error && (
          <p className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {workstreams.length === 0 && (
          <p className="py-12 text-center text-slate-500">
            Create a workstream to get started.
          </p>
        )}

        {kanban && prefs && (
          <KanbanBoard
            board={kanban}
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

        {dashboard && (
          <DashboardView data={dashboard} onTaskClick={handleTaskClick} />
        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await api.createWorkstream(newWsName);
              setNewWsName("");
              setShowWorkstreamForm(false);
              await refresh();
            }}
            className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">New workstream</h2>
            <input
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="Name"
              className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowWorkstreamForm(false)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300"
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
