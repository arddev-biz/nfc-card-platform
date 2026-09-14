"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AdminThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "admin-theme";

function resolveTheme(preference: AdminThemePreference): "light" | "dark" {
  if (preference === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return preference;
}

interface AdminThemeContextValue {
  preference: AdminThemePreference;
  setPreference: (preference: AdminThemePreference) => void;
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function useAdminTheme(): AdminThemeContextValue {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return context;
}

/**
 * A tiny blocking script, inlined before hydration, so the correct
 * theme applies on first paint instead of flashing light-then-dark.
 * This is the one standard exception to "no inline scripts" for exactly
 * this kind of first-paint theming problem.
 */
export function AdminThemeScript() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem('${STORAGE_KEY}') || 'system';
        var resolved = stored === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : stored;
        document.documentElement.setAttribute('data-admin-theme', resolved);
      } catch (e) {}
    })();
  `;
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AdminThemePreference>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as AdminThemePreference | null) ?? "system";
    setPreferenceState(stored);
    setResolved(resolveTheme(stored));
    // The blocking script (AdminThemeScript) sets this on <html> only to
    // avoid a flash on first paint, before React has mounted. Once this
    // provider's own div is rendered with the same attribute, remove it
    // from <html> — otherwise, since CSS custom properties inherit, a
    // stale value left on the ancestor would keep overriding this div's
    // own attribute on every later theme switch (an ancestor override
    // that never gets reset), silently breaking the toggle.
    document.documentElement.removeAttribute("data-admin-theme");
  }, []);

  useEffect(() => {
    if (preference !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(resolveTheme("system"));
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [preference]);

  function setPreference(next: AdminThemePreference) {
    setPreferenceState(next);
    setResolved(resolveTheme(next));
    localStorage.setItem(STORAGE_KEY, next);
  }

  const value = useMemo(() => ({ preference, setPreference }), [preference]);

  return (
    <AdminThemeContext.Provider value={value}>
      <div data-admin-theme={resolved} className="min-h-screen bg-[var(--admin-bg)]">
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}
