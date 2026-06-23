export function CompleteCircle({
  done,
  onClick,
}: {
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`mt-0.5 grid h-[21px] w-[21px] shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out hover:scale-110 active:scale-95 ${
        done
          ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[var(--shadow-sm)]"
          : "border-[var(--circle-border)] text-transparent hover:border-[var(--accent)] hover:text-[var(--accent)]"
      }`}
      aria-label={done ? "Mark task incomplete" : "Complete task"}
      title={done ? "Mark incomplete" : "Complete"}
    >
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
        <path
          d="M1.3 5.2 4.4 8.1 10.7 1.3"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
