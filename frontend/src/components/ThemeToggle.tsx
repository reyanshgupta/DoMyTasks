"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "domytasks-theme";
const THEME_EVENT = "domytasks-theme-change";

function readTheme(): Theme {
  if (typeof document !== "undefined") {
    const theme = document.documentElement.dataset.theme;
    if (theme === "dark" || theme === "light") return theme;
  }
  return "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(THEME_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readServerTheme(): Theme {
  return "light";
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.4v1.4M8 13.2v1.4M13.2 8h1.4M1.4 8h1.4M11.7 4.3l1-1M3.3 12.7l1-1M11.7 11.7l1 1M3.3 3.3l1 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.3 10.2A5.8 5.8 0 0 1 5.8 2.7a6.1 6.1 0 1 0 7.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle({
  className = "",
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "compact";
}) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, readServerTheme);

  useEffect(() => {
    const current = readTheme();
    document.documentElement.style.colorScheme = current;
    window.dispatchEvent(new Event(THEME_EVENT));
    const frame = window.requestAnimationFrame(() => {
      document.documentElement.classList.add("theme-animate");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const next = readTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        aria-pressed={theme === "dark"}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        onClick={toggleTheme}
        className={`theme-toggle-compact ${className}`}
      >
        <span className="theme-toggle-compact-icon" aria-hidden="true">
          {theme === "dark" ? <MoonIcon /> : <SunIcon />}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
    >
      <span className="theme-toggle-state" aria-hidden="true">
        <span className="theme-toggle-symbol-stack">
          <span className="theme-toggle-symbol theme-toggle-symbol-light">
            <SunIcon />
          </span>
          <span className="theme-toggle-symbol theme-toggle-symbol-dark">
            <MoonIcon />
          </span>
        </span>
        <span className="theme-toggle-copy">
          <span className="theme-toggle-mode theme-toggle-mode-light">Light</span>
          <span className="theme-toggle-mode theme-toggle-mode-dark">Dark</span>
        </span>
      </span>
      <span className="theme-toggle-switch" aria-hidden="true">
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}
