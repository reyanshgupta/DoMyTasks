import type { DashboardResponse, KanbanResponse, TaskCard, ViewPrefs } from "@/lib/types";

export function flattenDashboard(data: DashboardResponse | null): TaskCard[] {
  if (!data) return [];
  if (data.tasks) return data.tasks;
  return data.groups?.flatMap((group) => group.tasks) || [];
}

export function flattenKanban(data: KanbanResponse | null): TaskCard[] {
  return data?.columns.flatMap((column) => column.tasks) || [];
}

export function filterDashboard(data: DashboardResponse | null, query: string): DashboardResponse | null {
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

export function filterKanban(data: KanbanResponse | null, query: string): KanbanResponse | null {
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

export function countByWorkstream(tasks: TaskCard[], workstreamId: string): number {
  return tasks.filter((task) => task.workstream.id === workstreamId && task.status !== "done").length;
}

export function normalizeViewPrefs(prefs: ViewPrefs): ViewPrefs {
  if (prefs.group_by === "workstream") {
    return { ...prefs, group_by: "flat" };
  }
  return prefs;
}
