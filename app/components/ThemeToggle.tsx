"use client";

import { useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "draftly-theme";

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document !== "undefined") {
      const current = document.documentElement.dataset.theme;
      if (current === "light" || current === "dark") return current;
    }
    return getStoredTheme() ?? "dark";
  });
  const light = theme === "light";

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={light}
      onClick={toggleTheme}
      className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--bg-sunken)] p-1 text-left transition-colors hover:border-[var(--ink-faint)]"
    >
      <span
        aria-hidden
        className={`grid h-8 w-8 place-items-center rounded-full text-base transition-colors ${
          light ? "bg-[var(--amber)] text-[var(--accent-ink)]" : "bg-[var(--violet-soft)] text-[var(--violet)]"
        }`}
      >
        {light ? "☀️" : "🌙"}
      </span>
      <span className="pr-3">
        <span className="block text-[13px] font-bold text-[var(--ink)]">{light ? "ライトモード" : "ダークモード"}</span>
        <span className="block text-[11px] text-[var(--ink-faint)]">タップで切り替え</span>
      </span>
    </button>
  );
}
