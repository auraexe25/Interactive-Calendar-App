"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "night";

const STORAGE_KEY = "wallcal-theme-mode";
const THEMES: ThemeMode[] = ["light", "dark", "night"];

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  function applyTheme(mode: ThemeMode) {
    document.documentElement.setAttribute("data-theme", mode);
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved && THEMES.includes(saved)) {
      setTheme(saved);
      return;
    }

    applyTheme("light");
  }, []);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function onSelect(mode: ThemeMode) {
    setTheme(mode);
  }

  return (
    <div className="fixed right-4 top-4 z-40 rounded-full border border-white/40 bg-white/70 p-1 backdrop-blur-md shadow-[0_8px_22px_rgba(8,20,40,0.22)] md:right-8 md:top-6">
      <div className="flex items-center gap-1">
        {THEMES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSelect(mode)}
            className={[
              "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition",
              theme === mode
                ? "bg-[color:var(--toggle-active-bg)] text-[color:var(--toggle-active-text)]"
                : "text-[color:var(--toggle-idle-text)] hover:bg-white/40",
            ].join(" ")}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
