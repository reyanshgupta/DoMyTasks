import type { DashboardResponse, TaskCard, TaskStatus } from "@/lib/types";

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

function statusLabel(status: TaskStatus) {
  if (status === "doing") return "In progress";
  if (status === "done") return "Done";
  return "";
}

function CompleteCircle({
  done,
  onClick,
}: {
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`mt-0.5 grid h-[21px] w-[21px] shrink-0 place-items-center rounded-full border transition-colors ${
        done
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--circle-border)] text-transparent hover:border-[var(--accent)] hover:text-[var(--accent)]"
      }`}
      aria-label={done ? "Mark task incomplete" : "Complete task"}
      title={done ? "Mark incomplete" : "Complete"}
    >
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
        <path d="M1.3 5.2 4.4 8.1 10.7 1.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function TaskRow({
  task,
  onClick,
  onToggleTask,
}: {
  task: TaskCard;
  onClick: () => void;
  onToggleTask: (id: string, status: TaskStatus) => void;
}) {
  const color = task.workstream.color || "#8e8e93";
  const due = formatDue(task.due_at);
  const priority = PRIORITY_LABELS[task.priority] || "";
  const status = statusLabel(task.status);

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className="group flex cursor-pointer gap-3 rounded-[8px] px-3 py-2.5 outline-none transition-colors hover:bg-[var(--row-hover)] focus-visible:bg-[var(--row-hover)]"
    >
      <CompleteCircle
        done={task.status === "done"}
        onClick={() => onToggleTask(task.id, task.status)}
      />
      <div className="min-w-0 flex-1 border-b border-[var(--border-subtle)] pb-2.5 group-last:border-b-0 group-last:pb-0">
        <div className="flex min-w-0 items-start gap-3">
          <p
            className={`min-w-0 flex-1 break-words text-[15px] font-medium leading-snug ${
              task.status === "done"
                ? "text-[var(--text-muted)] line-through"
                : "text-[var(--text)]"
            }`}
          >
            {task.title}
          </p>
          {priority && (
            <span
              className={`shrink-0 rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${
                task.priority >= 3
                  ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                  : task.priority === 2
                    ? "bg-[var(--warning-soft)] text-[var(--warning)]"
                    : "bg-[var(--surface-strong)] text-[var(--text-muted)]"
              }`}
            >
              {priority}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-[var(--text-muted)]">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="truncate">{task.workstream.name}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className={due.urgent ? "font-semibold text-[var(--danger)]" : ""}>
            {due.label || "No date"}
          </span>
          {status && (
            <>
              <span aria-hidden="true">·</span>
              <span>{status}</span>
            </>
          )}
          {task.claimed_by && (
            <>
              <span aria-hidden="true">·</span>
              <span className="max-w-[160px] truncate text-[var(--doing)]">
                {task.claimed_by}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskList({
  tasks,
  onTaskClick,
  onToggleTask,
}: {
  tasks: TaskCard[];
  onTaskClick: (id: string) => void;
  onToggleTask: (id: string, status: TaskStatus) => void;
}) {
  if (tasks.length === 0) return <EmptyState />;

  return (
    <div className="overflow-hidden rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-[var(--shadow-sm)]">
      <div className="divide-y-0 px-1 py-1">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task.id)}
            onToggleTask={onToggleTask}
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardView({
  data,
  onTaskClick,
  onToggleTask,
}: {
  data: DashboardResponse;
  onTaskClick: (id: string) => void;
  onToggleTask: (id: string, status: TaskStatus) => void;
}) {
  if (data.group_by === "flat" && data.tasks) {
    return (
      <TaskList
        tasks={data.tasks}
        onTaskClick={onTaskClick}
        onToggleTask={onToggleTask}
      />
    );
  }

  return (
    <div className="space-y-7">
      {data.groups?.map((group) => (
        <section key={group.key}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <h3 className="text-[13px] font-semibold uppercase text-[var(--text-muted)]">
              {group.label}
            </h3>
            <span className="text-[12px] font-semibold tabular-nums text-[var(--text-muted)]">
              {group.tasks.length}
            </span>
          </div>
          <TaskList
            tasks={group.tasks}
            onTaskClick={onTaskClick}
            onToggleTask={onToggleTask}
          />
        </section>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[8px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-raised)] px-6 py-12 text-center">
      <p className="text-[15px] font-semibold text-[var(--text-secondary)]">No tasks</p>
    </div>
  );
}
