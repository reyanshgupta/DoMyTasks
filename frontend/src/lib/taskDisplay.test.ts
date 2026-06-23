import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  emptyGroupMessage,
  formatDue,
  PRIORITY_LABELS,
  statusLabel,
} from "@/lib/taskDisplay";

describe("PRIORITY_LABELS", () => {
  it("maps priority indices to labels", () => {
    expect(PRIORITY_LABELS).toEqual(["", "Low", "Medium", "High"]);
  });
});

describe("formatDue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty for null due date", () => {
    expect(formatDue(null)).toEqual({ label: "", urgent: false });
  });

  it("marks overdue tasks urgent", () => {
    expect(formatDue("2026-06-20T00:00:00Z")).toEqual({
      label: "Overdue",
      urgent: true,
    });
  });

  it("marks today urgent", () => {
    expect(formatDue("2026-06-22T18:00:00Z")).toEqual({
      label: "Today",
      urgent: true,
    });
  });

  it("labels tomorrow", () => {
    expect(formatDue("2026-06-23T12:00:00")).toEqual({
      label: "Tomorrow",
      urgent: false,
    });
  });

  it("formats future dates", () => {
    const result = formatDue("2026-08-15T12:00:00");
    expect(result.urgent).toBe(false);
    expect(result.label).toMatch(/Aug/);
  });
});

describe("statusLabel", () => {
  it("maps statuses to labels", () => {
    expect(statusLabel("todo")).toBe("");
    expect(statusLabel("doing")).toBe("In progress");
    expect(statusLabel("done")).toBe("Done");
  });
});

describe("emptyGroupMessage", () => {
  it("returns group-specific copy", () => {
    expect(emptyGroupMessage("overdue")).toBe("Nothing overdue");
    expect(emptyGroupMessage("today")).toBe("Nothing due today");
    expect(emptyGroupMessage("unknown")).toBe("No tasks");
  });
});
