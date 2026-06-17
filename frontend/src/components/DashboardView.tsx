import { TaskCard } from "./TaskCard";
import type { DashboardResponse } from "@/lib/types";

export function DashboardView({
  data,
  onTaskClick,
}: {
  data: DashboardResponse;
  onTaskClick: (id: string) => void;
}) {
  if (data.group_by === "flat" && data.tasks) {
    return (
      <div className="grid gap-2">
        {data.tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
        ))}
        {data.tasks.length === 0 && (
          <p className="text-center text-slate-500 py-8">No tasks yet</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.groups?.map((group) => (
        <section key={group.key}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            {group.label} ({group.tasks.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
