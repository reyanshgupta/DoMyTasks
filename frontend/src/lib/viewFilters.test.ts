import { describe, expect, it } from "vitest";
import type { DashboardResponse, KanbanResponse, TaskCard, ViewPrefs } from "@/lib/types";
import {
  countByWorkstream,
  filterDashboard,
  filterKanban,
  flattenDashboard,
  flattenKanban,
  normalizeViewPrefs,
} from "@/lib/viewFilters";

const ws = { id: "eng", name: "Engineering", color: "#000" };

function task(overrides: Partial<TaskCard> = {}): TaskCard {
  return {
    id: "1",
    title: "Fix auth",
    status: "todo",
    priority: 1,
    due_at: null,
    workstream: ws,
    sort_order: null,
    claimed_by: null,
    ...overrides,
  };
}

describe("flattenDashboard", () => {
  it("returns empty for null", () => {
    expect(flattenDashboard(null)).toEqual([]);
  });

  it("returns flat tasks", () => {
    const data: DashboardResponse = {
      layout: "flat",
      group_by: "flat",
      sort_by: "priority",
      tasks: [task()],
      summary: { total: 1, by_status: { todo: 1, doing: 0, done: 0 } },
    };
    expect(flattenDashboard(data)).toHaveLength(1);
  });

  it("flattens grouped tasks", () => {
    const data: DashboardResponse = {
      layout: "grouped",
      group_by: "day",
      sort_by: "priority",
      groups: [{ key: "today", label: "Today", tasks: [task(), task({ id: "2" })] }],
      summary: { total: 2, by_status: { todo: 2, doing: 0, done: 0 } },
    };
    expect(flattenDashboard(data)).toHaveLength(2);
  });
});

describe("flattenKanban", () => {
  it("returns empty for null", () => {
    expect(flattenKanban(null)).toEqual([]);
  });

  it("flattens columns", () => {
    const data: KanbanResponse = {
      sort_by: "priority",
      columns: [
        { status: "todo", tasks: [task()] },
        { status: "doing", tasks: [task({ id: "2", status: "doing" })] },
      ],
    };
    expect(flattenKanban(data)).toHaveLength(2);
  });
});

describe("filterDashboard", () => {
  const flatData: DashboardResponse = {
    layout: "flat",
    group_by: "flat",
    sort_by: "priority",
    tasks: [task(), task({ id: "2", title: "Deploy", workstream: { ...ws, name: "Ops" } })],
    summary: { total: 2, by_status: { todo: 2, doing: 0, done: 0 } },
  };

  it("passes through empty query", () => {
    expect(filterDashboard(flatData, "")).toBe(flatData);
    expect(filterDashboard(flatData, "   ")).toBe(flatData);
  });

  it("filters flat tasks by title", () => {
    const result = filterDashboard(flatData, "deploy");
    expect(result?.tasks).toHaveLength(1);
    expect(result?.tasks?.[0].title).toBe("Deploy");
  });

  it("filters grouped tasks", () => {
    const grouped: DashboardResponse = {
      layout: "grouped",
      group_by: "day",
      sort_by: "priority",
      groups: [
        { key: "today", label: "Today", tasks: [task(), task({ id: "2", title: "Other" })] },
      ],
      summary: { total: 2, by_status: { todo: 2, doing: 0, done: 0 } },
    };
    const result = filterDashboard(grouped, "auth");
    expect(result?.groups?.[0].tasks).toHaveLength(1);
  });
});

describe("filterKanban", () => {
  const data: KanbanResponse = {
    sort_by: "priority",
    columns: [
      {
        status: "todo",
        tasks: [task(), task({ id: "2", title: "Review PR" })],
      },
    ],
  };

  it("filters tasks per column", () => {
    const result = filterKanban(data, "review");
    expect(result?.columns[0].tasks).toHaveLength(1);
  });
});

describe("countByWorkstream", () => {
  it("counts open tasks only", () => {
    const tasks = [
      task(),
      task({ id: "2", status: "done" }),
      task({ id: "3", workstream: { id: "other", name: "Other", color: null } }),
    ];
    expect(countByWorkstream(tasks, "eng")).toBe(1);
  });
});

describe("normalizeViewPrefs", () => {
  it("migrates deprecated workstream group_by", () => {
    const prefs: ViewPrefs = {
      view: "dashboard",
      group_by: "workstream",
      sort_by: "priority",
      sort_dir: "desc",
      workstream_ids: null,
      hide_done: false,
    };
    expect(normalizeViewPrefs(prefs).group_by).toBe("flat");
  });

  it("leaves other prefs unchanged", () => {
    const prefs: ViewPrefs = {
      view: "kanban",
      group_by: "day",
      sort_by: "due_at",
      sort_dir: "asc",
      workstream_ids: ["eng"],
      hide_done: true,
    };
    expect(normalizeViewPrefs(prefs)).toEqual(prefs);
  });
});
