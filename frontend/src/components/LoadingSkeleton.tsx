function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-[6px] bg-[var(--surface-strong)] ${className}`}
      aria-hidden="true"
    />
  );
}

export function ListSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-[var(--shadow-sm)]"
      aria-busy="true"
      aria-label="Loading tasks"
    >
      <div className="space-y-0 px-1 py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-3">
            <Shimmer className="mt-0.5 h-[21px] w-[21px] rounded-full" />
            <div className="min-w-0 flex-1 space-y-2 border-b border-[var(--border-subtle)] pb-3 last:border-b-0">
              <Shimmer className="h-4 w-3/5" />
              <Shimmer className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-6"
      aria-busy="true"
      aria-label="Loading board"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex min-w-[270px] flex-1 flex-col overflow-hidden rounded-[8px] border border-[var(--border-subtle)] bg-[var(--kanban-column)]"
        >
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--kanban-header)] px-4 py-3">
            <Shimmer className="h-2.5 w-2.5 rounded-full" />
            <Shimmer className="h-3.5 w-20" />
          </div>
          <div className="space-y-2.5 p-2.5">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-3.5 py-3"
              >
                <Shimmer className="mb-2 h-4 w-4/5" />
                <Shimmer className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
