"use client";

import type { TaskCard as TaskCardType, TaskStatus } from "@/lib/types";
import { formatDue } from "@/lib/taskDisplay";
import { CompleteCircle } from "@/components/CompleteCircle";
import { PriorityBadge } from "@/components/PriorityBadge";

export function TaskCard({
  task,
  onClick,
  onToggle,
  dragHandle,
  isDragPreview,
}: {
  task: TaskCardType;
  onClick?: () => void;
  onToggle?: (id: string, status: TaskStatus) => void;
  dragHandle?: React.ReactNode;
  /** Suppress mount animation and hover motion when rendered in DragOverlay */
  isDragPreview?: boolean;
}) {
  const color = task.workstream.color || "#8e8e93";
  const due = formatDue(task.due_at);

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
      className={`${isDragPreview ? "" : "animate-list-in"} group rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-3.5 py-3 shadow-[var(--shadow-sm)] outline-none transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 ease-out ${
        isDragPreview
          ? "cursor-grabbing"
          : "hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--row-hover)] hover:shadow-[var(--shadow-md)] focus-visible:bg-[var(--row-hover)] active:scale-[0.995]"
      } ${onClick && !isDragPreview ? "cursor-pointer" : ""} ${
        task.status === "done" ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        {dragHandle}
        {onToggle ? (
          <CompleteCircle
            done={task.status === "done"}
            onClick={() => onToggle(task.id, task.status)}
          />
        ) : (
          <span
            className={`mt-0.5 h-[21px] w-[21px] shrink-0 rounded-full border ${
              task.status === "done"
                ? "border-[var(--accent)] bg-[var(--accent)] shadow-[var(--shadow-sm)]"
                : "border-[var(--circle-border)] transition-colors group-hover:border-[var(--accent)]"
            }`}
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <p
              className={`min-w-0 flex-1 break-words text-[14px] font-medium leading-snug ${
                task.status === "done"
                  ? "text-[var(--text-muted)] line-through"
                  : "text-[var(--text)]"
              }`}
            >
              {task.title}
            </p>
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-[var(--text-muted)]">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="truncate">{task.workstream.name}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className={due.urgent ? "font-semibold text-[var(--danger)]" : ""}>
              {due.label || "No date"}
            </span>
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
