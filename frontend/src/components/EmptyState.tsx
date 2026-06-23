export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="animate-scale-in rounded-[8px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-raised)] px-6 py-12 text-center transition-colors">
      <p className="text-[15px] font-semibold text-[var(--text-secondary)]">{title}</p>
      {description && (
        <p className="mt-1.5 text-[13px] font-medium text-[var(--text-muted)]">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex h-9 items-center rounded-[8px] bg-[var(--accent-soft)] px-4 text-[13px] font-semibold text-[var(--accent)] transition-[background-color,transform] duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
