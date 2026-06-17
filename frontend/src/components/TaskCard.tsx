import type { TaskCard as TaskCardType } from "@/lib/types";

function formatDue(due: string | null): string {
  if (!due) return "no date";
  const d = new Date(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(d);
  dueDay.setHours(0, 0, 0, 0);
  if (dueDay.getTime() === today.getTime()) return "today";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TaskCard({
  task,
  onClick,
  dragHandle,
}: {
  task: TaskCardType;
  onClick?: () => void;
  dragHandle?: React.ReactNode;
}) {
  const color = task.workstream.color || "#64748b";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800/80 p-3 shadow-sm transition hover:border-slate-600"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {dragHandle}
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            title={task.workstream.name}
          />
          <span className="truncate text-sm font-medium text-white">
            {task.title}
          </span>
        </div>
        <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
          P{task.priority}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{task.workstream.name}</span>
        <span>due: {formatDue(task.due_at)}</span>
      </div>
      {task.claimed_by && (
        <div className="mt-1 text-xs text-amber-400">claimed: {task.claimed_by}</div>
      )}
    </div>
  );
}
