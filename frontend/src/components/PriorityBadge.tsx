import { PRIORITY_LABELS } from "@/lib/taskDisplay";

export function PriorityBadge({ priority }: { priority: number }) {
  const label = PRIORITY_LABELS[priority] || "";
  if (!label) return null;

  return (
    <span
      className={`shrink-0 rounded-[6px] px-2 py-0.5 text-[11px] font-semibold transition-colors ${
        priority >= 3
          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
          : priority === 2
            ? "bg-[var(--warning-soft)] text-[var(--warning)]"
            : "bg-[var(--surface-strong)] text-[var(--text-muted)]"
      }`}
    >
      {label}
    </span>
  );
}
