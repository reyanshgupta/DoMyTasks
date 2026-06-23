import type { DashboardResponse, TaskCard, TaskStatus } from "@/lib/types";
import { emptyGroupMessage, formatDue, statusLabel } from "@/lib/taskDisplay";
import { CompleteCircle } from "@/components/CompleteCircle";
import { EmptyState } from "@/components/EmptyState";
import { PriorityBadge } from "@/components/PriorityBadge";

function TaskRow({
  task,
  onClick,
  onToggleTask,
  index,
}: {
  task: TaskCard;
  onClick: () => void;
  onToggleTask: (id: string, status: TaskStatus) => void;
  index: number;
}) {
  const color = task.workstream.color || "#8e8e93";
  const due = formatDue(task.due_at);
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
      style={{ animationDelay: `${Math.min(index * 22, 160)}ms` }}
      className="animate-list-in group flex cursor-pointer gap-3 rounded-[8px] px-3 py-2.5 outline-none transition-[background-color,transform] duration-200 ease-out hover:translate-x-1 hover:bg-[var(--row-hover)] focus-visible:bg-[var(--row-hover)] active:scale-[0.995]"
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
          <PriorityBadge priority={task.priority} />
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
  searchQuery,
  onClearSearch,
  emptyTitle,
}: {
  tasks: TaskCard[];
  onTaskClick: (id: string) => void;
  onToggleTask: (id: string, status: TaskStatus) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  emptyTitle?: string;
}) {
  if (tasks.length === 0) {
    if (searchQuery?.trim()) {
      return (
        <EmptyState
          title={`No tasks match "${searchQuery.trim()}"`}
          actionLabel="Clear search"
          onAction={onClearSearch}
        />
      );
    }
    return <EmptyState title={emptyTitle || "No tasks"} />;
  }

  return (
    <div className="animate-fade-up overflow-hidden rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-[var(--shadow-sm)] transition-[background-color,border-color,box-shadow] duration-200">
      <div className="divide-y-0 px-1 py-1">
        {tasks.map((task, index) => (
          <TaskRow
            key={task.id}
            task={task}
            index={index}
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
  searchQuery,
  onClearSearch,
}: {
  data: DashboardResponse;
  onTaskClick: (id: string) => void;
  onToggleTask: (id: string, status: TaskStatus) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}) {
  if (data.group_by === "flat" && data.tasks) {
    return (
      <TaskList
        tasks={data.tasks}
        onTaskClick={onTaskClick}
        onToggleTask={onToggleTask}
        searchQuery={searchQuery}
        onClearSearch={onClearSearch}
      />
    );
  }

  const groups = data.groups || [];
  const hasAnyTasks = groups.some((g) => g.tasks.length > 0);

  if (!hasAnyTasks && searchQuery?.trim()) {
    return (
      <EmptyState
        title={`No tasks match "${searchQuery.trim()}"`}
        actionLabel="Clear search"
        onAction={onClearSearch}
      />
    );
  }

  return (
    <div className="space-y-7">
      {groups.map((group, index) => (
        <section
          key={group.key}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(index * 42, 180)}ms` }}
        >
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
            searchQuery={searchQuery}
            onClearSearch={onClearSearch}
            emptyTitle={emptyGroupMessage(group.key)}
          />
        </section>
      ))}
    </div>
  );
}
