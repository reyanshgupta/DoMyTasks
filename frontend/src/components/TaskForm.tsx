"use client";

import { useEffect, useState } from "react";
import type { TaskCreateInput, TaskDetail, TaskStatus, TaskUpdateInput, Workstream } from "@/lib/types";

export function TaskForm({
  workstreams,
  initial,
  onSubmit,
  onCancel,
  onDelete,
}: {
  workstreams: Workstream[];
  initial?: TaskDetail | null;
  onSubmit: (data: TaskCreateInput | TaskUpdateInput) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [workstreamId, setWorkstreamId] = useState(
    initial?.workstream.id || workstreams[0]?.id || "",
  );
  const [title, setTitle] = useState(initial?.title || "");
  const [context, setContext] = useState(initial?.context || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [priority, setPriority] = useState(initial?.priority ?? 0);
  const [status, setStatus] = useState<TaskStatus>(initial?.status || "todo");
  const [dueAt, setDueAt] = useState(
    initial?.due_at ? initial.due_at.slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workstreamId && workstreams[0]) {
      setWorkstreamId(workstreams[0].id);
    }
  }, [workstreams, workstreamId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: TaskCreateInput | TaskUpdateInput = {
        workstream_id: workstreamId,
        title,
        context,
        notes: notes || undefined,
        priority,
        status,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-white">
          {initial ? "Edit task" : "New task"}
        </h2>

        <label className="mb-3 block text-sm text-slate-300">
          Workstream
          <select
            value={workstreamId}
            onChange={(e) => setWorkstreamId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            required
          >
            {workstreams.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-3 block text-sm text-slate-300">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            required
          />
        </label>

        <label className="mb-3 block text-sm text-slate-300">
          Context (agent pickup packet)
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-white"
            required
          />
        </label>

        <label className="mb-3 block text-sm text-slate-300">
          Notes (human only)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
          />
        </label>

        <div className="mb-3 grid grid-cols-3 gap-3">
          <label className="text-sm text-slate-300">
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            >
              {[0, 1, 2, 3].map((p) => (
                <option key={p} value={p}>
                  P{p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-300">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            >
              <option value="todo">todo</option>
              <option value="doing">doing</option>
              <option value="done">done</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">
            Due date
            <input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            />
          </label>
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="ml-auto rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 hover:bg-red-950"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
