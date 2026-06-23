import type { ViewPrefs } from "@/lib/types";

export function SidebarItem({
  active,
  icon,
  label,
  count,
  color,
  onClick,
}: {
  active: boolean;
  icon?: React.ReactNode;
  label: string;
  count?: number;
  color?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 w-full items-center gap-2 rounded-[8px] px-2.5 text-left text-[14px] font-medium transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:translate-x-0.5 active:scale-[0.99] ${
        active
          ? "bg-[var(--sidebar-active)] text-[var(--text)] shadow-[var(--shadow-sm)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text)]"
      }`}
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center text-[var(--text-muted)]">
        {color ? (
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        ) : (
          icon
        )}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-[var(--badge)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--text-muted)] transition-colors">
          {count}
        </span>
      )}
    </button>
  );
}
