import type { TaskCard as TaskCardType } from "@/lib/types";

function formatDue(due: string | null): { label: string; urgent: boolean } {
  if (!due) return { label: "", urgent: false };
  const d = new Date(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(d);
  dueDay.setHours(0, 0, 0, 0);
  const diff = (dueDay.getTime() - today.getTime()) / 86400000;
  if (diff < 0) return { label: "Overdue", urgent: true };
  if (diff === 0) return { label: "Today", urgent: true };
  if (diff === 1) return { label: "Tomorrow", urgent: false };
  return {
    label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    urgent: false,
  };
}

const PRIORITY_LABELS = ["", "Low", "Medium", "High"];

export function TaskCard({
  task,
  onClick,
  dragHandle,
}: {
  task: TaskCardType;
  onClick?: () => void;
  dragHandle?: React.ReactNode;
}) {
  const color = task.workstream.color || "#8e8e93";
  const due = formatDue(task.due_at);
  const priority = PRIORITY_LABELS[task.priority] || "";

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`animate-list-in group rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-3.5 py-3 shadow-[var(--shadow-sm)] outline-none transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--row-hover)] hover:shadow-[var(--shadow-md)] focus-visible:bg-[var(--row-hover)] active:scale-[0.995] ${
        onClick ? "cursor-pointer" : ""
      } ${task.status === "done" ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        {dragHandle}
        <span
          className={`mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border ${
            task.status === "done"
              ? "border-[var(--accent)] bg-[var(--accent)] shadow-[var(--shadow-sm)]"
              : "border-[var(--circle-border)] transition-colors group-hover:border-[var(--accent)]"
          }`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p
            className={`break-words text-[14px] font-medium leading-snug ${
              task.status === "done"
                ? "text-[var(--text-muted)] line-through"
                : "text-[var(--text)]"
            }`}
          >
            {task.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-[var(--text-muted)]">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="truncate">{task.workstream.name}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className={due.urgent ? "font-semibold text-[var(--danger)]" : ""}>
              {due.label || "No date"}
            </span>
            {priority && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    task.priority >= 3
                      ? "font-semibold text-[var(--danger)]"
                      : task.priority === 2
                        ? "font-semibold text-[var(--warning)]"
                        : ""
                  }
                >
                  {priority}
                </span>
              </>
            )}
            {task.claimed_by && (
              <>
                <span aria-hidden="true">·</span>
                <span className="max-w-[150px] truncate text-[var(--doing)]">
                  {task.claimed_by}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
