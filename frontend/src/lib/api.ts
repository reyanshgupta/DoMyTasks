import { getToken } from "./auth";
import type {
  AuthSession,
  DashboardResponse,
  KanbanResponse,
  TaskCard,
  TaskCreateInput,
  TaskDetail,
  TaskUpdateInput,
  ViewPrefs,
  Workstream,
} from "./types";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function buildQuery(params: Record<string, string | string[] | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) search.append(key, v);
    } else {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers, credentials: "same-origin" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getAuthSession: () => request<AuthSession>("/api/auth/session"),

  login: (token: string) =>
    request<AuthSession>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  logout: () =>
    request<AuthSession>("/api/auth/logout", {
      method: "POST",
    }),

  listWorkstreams: () => request<Workstream[]>("/api/workstreams"),

  createWorkstream: (name: string, color?: string) =>
    request<Workstream>("/api/workstreams", {
      method: "POST",
      body: JSON.stringify({ name, color }),
    }),

  listTasks: (params?: Record<string, string>) => {
    const qs = params ? buildQuery(params) : "";
    return request<TaskCard[]>(`/api/tasks${qs}`);
  },

  getTask: (id: string) => request<TaskDetail>(`/api/tasks/${id}`),

  createTask: (data: TaskCreateInput) =>
    request<TaskDetail>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTask: (id: string, data: TaskUpdateInput) =>
    request<TaskDetail>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTask: (id: string) =>
    request<void>(`/api/tasks/${id}`, { method: "DELETE" }),

  completeTask: (id: string) =>
    request<TaskDetail>(`/api/tasks/${id}/complete`, { method: "POST" }),

  moveTask: (id: string, status: string) =>
    request<TaskDetail>(`/api/tasks/${id}/move`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  reorderTasks: (ordered_ids: string[]) =>
    request<TaskCard[]>("/api/tasks/reorder", {
      method: "POST",
      body: JSON.stringify({ ordered_ids }),
    }),

  getDashboard: (params: Record<string, string | string[] | undefined>) =>
    request<DashboardResponse>(`/api/dashboard${buildQuery(params)}`),

  getKanban: (params: Record<string, string | string[] | undefined>) =>
    request<KanbanResponse>(`/api/kanban${buildQuery(params)}`),

  getViewPrefs: () => request<ViewPrefs>("/api/settings/view"),

  setViewPrefs: (prefs: Partial<ViewPrefs>) =>
    request<ViewPrefs>("/api/settings/view", {
      method: "PATCH",
      body: JSON.stringify(prefs),
    }),
};

export { ApiError };
