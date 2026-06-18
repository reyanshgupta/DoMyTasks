"use client";

import { useState } from "react";
import type { TaskCreateInput, TaskDetail, TaskStatus, TaskUpdateInput, Workstream } from "@/lib/types";

const inputClass =
  "mt-1.5 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-[15px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--surface)]";

const labelClass = "block text-[13px] font-semibold text-[var(--text-secondary)]";

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
  const selectedWorkstreamId = workstreamId || workstreams[0]?.id || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: TaskCreateInput | TaskUpdateInput = {
        workstream_id: selectedWorkstreamId,
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(29,29,31,0.28)] p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
      >
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h2 className="text-[20px] font-semibold text-[var(--text)]">
            {initial ? "Edit task" : "New task"}
          </h2>
        </div>

        <div className="max-h-[calc(90vh-156px)] overflow-y-auto px-6 py-5">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
            <label className={labelClass}>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="What needs doing?"
                autoFocus
                required
              />
            </label>

            <label className={labelClass}>
              Workstream
              <select
                value={selectedWorkstreamId}
                onChange={(e) => setWorkstreamId(e.target.value)}
                className={inputClass}
                required
              >
                {workstreams.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={`mb-4 ${labelClass}`}>
            Context
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={6}
              className={`${inputClass} resize-y font-mono text-[13px] leading-relaxed`}
              placeholder="Links, goals, constraints"
              required
            />
          </label>

          <label className={`mb-4 ${labelClass}`}>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
              placeholder="Private notes"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className={inputClass}
              >
                <option value={0}>None</option>
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
              </select>
            </label>
            <label className={labelClass}>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={inputClass}
              >
                <option value="todo">To do</option>
                <option value="doing">In progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label className={labelClass}>
              Due
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-[10px] border border-[rgba(180,35,24,0.22)] bg-[var(--danger-soft)] px-3 py-2 text-[13px] font-medium text-[var(--danger)]">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--surface-muted)] px-6 py-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center rounded-[10px] bg-[var(--accent)] px-5 text-[14px] font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-[10px] px-4 text-[14px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            Cancel
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="ml-auto h-10 rounded-[10px] px-4 text-[14px] font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
