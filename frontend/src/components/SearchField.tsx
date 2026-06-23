import { SearchIcon } from "@/components/icons";

export function SearchField({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label
      className={`flex h-9 min-w-0 items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-[var(--text-muted)] shadow-[var(--shadow-sm)] transition-[background-color,border-color,box-shadow] duration-200 focus-within:border-[var(--accent)] focus-within:shadow-[var(--shadow-sm)] ${className}`}
    >
      <SearchIcon />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
      />
    </label>
  );
}
