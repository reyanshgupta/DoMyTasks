import { PlusIcon } from "@/components/icons";

export function WorkstreamFormModal({
  name,
  onNameChange,
  onSubmit,
  onCancel,
}: {
  name: string;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-dialog-in w-full max-w-sm rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-lg)]"
      >
        <h2 className="mb-5 text-[20px] font-semibold text-[var(--text)]">New Workstream</h2>
        <label className="mb-5 block text-[13px] font-semibold text-[var(--text-secondary)]">
          Name
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Personal, Work, Side project"
            autoFocus
            className="mt-1.5 w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-[15px] text-[var(--text)] outline-none transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--surface)]"
            required
          />
        </label>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!name.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[var(--accent)] px-5 text-[14px] font-semibold text-white shadow-[var(--shadow-sm)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          >
            <PlusIcon />
            Create
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-[8px] px-4 text-[14px] font-semibold text-[var(--text-secondary)] transition-[background-color,color,transform] duration-200 hover:bg-[var(--surface-muted)] hover:text-[var(--text)] active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
