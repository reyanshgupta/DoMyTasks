import type { TaskStatus } from "@/lib/types";

export const PRIORITY_LABELS = ["", "Low", "Medium", "High"];

export function formatDue(due: string | null): { label: string; urgent: boolean } {
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

export function statusLabel(status: TaskStatus): string {
  if (status === "doing") return "In progress";
  if (status === "done") return "Done";
  return "";
}

export function emptyGroupMessage(groupKey: string): string {
  switch (groupKey) {
    case "overdue":
      return "Nothing overdue";
    case "today":
      return "Nothing due today";
    case "tomorrow":
      return "Nothing due tomorrow";
    case "this_week":
      return "Nothing due this week";
    case "later":
      return "Nothing scheduled later";
    case "no_date":
      return "No undated tasks";
    default:
      return "No tasks";
  }
}
