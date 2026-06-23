export type TaskStatus = "todo" | "doing" | "done";

export interface AuthSession {
  authenticated: boolean;
  method: "bearer" | "session" | "authelia" | "local" | null;
  user: string | null;
  authelia_enabled: boolean;
}

export interface Workstream {
  id: string;
  name: string;
  color: string | null;
  created_at?: string;
}

export interface WorkstreamEmbed {
  id: string;
  name: string;
  color: string | null;
}

export interface TaskCard {
  id: string;
  title: string;
  status: TaskStatus;
  priority: number;
  due_at: string | null;
  workstream: WorkstreamEmbed;
  sort_order: number | null;
  claimed_by: string | null;
}

export interface TaskDetail extends TaskCard {
  context: string;
  notes: string | null;
  tags: string[] | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardGroup {
  key: string;
  label: string;
  tasks: TaskCard[];
}

export interface DashboardResponse {
  layout: string;
  group_by: string;
  sort_by: string;
  groups?: DashboardGroup[];
  tasks?: TaskCard[];
  summary: { total: number; by_status: Record<string, number> };
}

export interface KanbanColumn {
  status: TaskStatus;
  tasks: TaskCard[];
}

export interface KanbanResponse {
  sort_by: string;
  columns: KanbanColumn[];
}

export interface ViewPrefs {
  view: "kanban" | "dashboard";
  group_by: "day" | "workstream" | "flat";
  sort_by: "priority" | "due_at" | "updated_at" | "manual";
  sort_dir: "asc" | "desc";
  workstream_ids: string[] | null;
  hide_done: boolean;
}

export interface TaskCreateInput {
  workstream_id: string;
  title: string;
  context: string;
  notes?: string;
  status?: TaskStatus;
  priority?: number;
  due_at?: string | null;
}

export interface TaskUpdateInput {
  workstream_id?: string;
  title?: string;
  context?: string;
  notes?: string;
  status?: TaskStatus;
  priority?: number;
  due_at?: string | null;
}
