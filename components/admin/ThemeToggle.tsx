"use client";

import { useAdminTheme, type AdminThemePreference } from "@/components/admin/ThemeProvider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: AdminThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Soft Dark" },
  { value: "system", label: "System" },
];

export function ThemeToggle() {
  const { preference, setPreference } = useAdminTheme();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setPreference(option.value)}
          aria-pressed={preference === option.value}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium transition-colors",
            preference === option.value
              ? "bg-[var(--admin-accent)] text-[var(--admin-accent-text)]"
              : "text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
