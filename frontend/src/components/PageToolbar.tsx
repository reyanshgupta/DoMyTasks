import type { ViewPrefs, Workstream } from "@/lib/types";
import { SortAscIcon, SortDescIcon } from "@/components/icons";
import { WorkstreamFilter } from "@/components/WorkstreamFilter";

function QuietSelect({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-[13px] shadow-[var(--shadow-sm)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px hover:border-[var(--border-strong)]">
      <span className="text-[12px] font-medium text-[var(--text-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer border-0 bg-transparent py-0 pl-0 pr-5 text-[13px] font-semibold text-[var(--text)] outline-none"
      >
        {children}
      </select>
    </label>
  );
}

export function PageToolbar({
  prefs,
  workstreams,
  showWorkstreamFilter,
  onUpdate,
}: {
  prefs: ViewPrefs;
  workstreams: Workstream[];
  showWorkstreamFilter: boolean;
  onUpdate: (patch: Partial<ViewPrefs>) => void;
}) {
  return (
    <div className="relative z-10 animate-fade-up stagger-1 mb-5 flex flex-wrap items-center gap-2">
      <QuietSelect
        label="Sort"
        value={prefs.sort_by}
        onChange={(v) => onUpdate({ sort_by: v as ViewPrefs["sort_by"] })}
      >
        <option value="due_at">Due date</option>
        <option value="priority">Priority</option>
        <option value="updated_at">Updated</option>
        <option value="manual">Manual</option>
      </QuietSelect>
      <button
        type="button"
        aria-label={prefs.sort_dir === "asc" ? "Sort ascending" : "Sort descending"}
        title={prefs.sort_dir === "asc" ? "Ascending" : "Descending"}
        onClick={() => onUpdate({ sort_dir: prefs.sort_dir === "asc" ? "desc" : "asc" })}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] shadow-[var(--shadow-sm)] transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-px hover:border-[var(--border-strong)] hover:text-[var(--text)] active:translate-y-0 active:scale-[0.98]"
      >
        {prefs.sort_dir === "asc" ? <SortAscIcon /> : <SortDescIcon />}
      </button>
      {showWorkstreamFilter && (
        <WorkstreamFilter
          workstreams={workstreams}
          selectedIds={prefs.workstream_ids ?? null}
          onChange={(ids) => onUpdate({ workstream_ids: ids })}
        />
      )}
      {prefs.view === "kanban" && (
        <button
          type="button"
          aria-pressed={prefs.hide_done}
          onClick={() => onUpdate({ hide_done: !prefs.hide_done })}
          className={`inline-flex h-9 items-center gap-2 rounded-[8px] border px-3 text-[13px] font-semibold shadow-[var(--shadow-sm)] transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] ${
            prefs.hide_done
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              prefs.hide_done ? "bg-[var(--accent)]" : "bg-[var(--text-muted)]"
            }`}
          />
          Hide Done
        </button>
      )}
    </div>
  );
}
