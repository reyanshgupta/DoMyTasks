import type { ViewPrefs } from "@/lib/types";

export function ViewSwitcher({
  prefs,
  onUpdate,
}: {
  prefs: ViewPrefs | null;
  onUpdate: (patch: Partial<ViewPrefs>) => void;
}) {
  const activeView =
    prefs?.view === "kanban"
      ? "board"
      : prefs?.group_by === "day"
        ? "scheduled"
        : "list";

  const items = [
    {
      id: "list" as const,
      label: "List",
      active: activeView === "list",
      onClick: () => onUpdate({ view: "dashboard", group_by: "flat", workstream_ids: null }),
    },
    {
      id: "scheduled" as const,
      label: "Scheduled",
      active: activeView === "scheduled",
      onClick: () =>
        onUpdate({ view: "dashboard", group_by: "day", sort_by: "due_at", sort_dir: "asc" }),
    },
    {
      id: "board" as const,
      label: "Board",
      active: activeView === "board",
      onClick: () => onUpdate({ view: "kanban" }),
    },
  ];

  return (
    <div
      className="flex rounded-[8px] border border-[var(--border)] bg-[var(--surface-raised)] p-1 shadow-[var(--shadow-sm)] lg:hidden"
      role="tablist"
      aria-label="View"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.active}
          onClick={item.onClick}
          className={`flex-1 rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-[background-color,color,transform] duration-200 active:scale-[0.98] ${
            item.active
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text)]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
