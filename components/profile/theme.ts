import type { ResolvedBackground } from "@/lib/background";

/**
 * The single source of truth for the "Liquid Glass Hospitality" look of
 * the public profile and menu. Everything visual is derived from two
 * inputs — the business's chosen accent color and whether its resolved
 * background is light or dark — so a profile automatically reads
 * correctly on a plain white background, a bright gradient, or a dark
 * ambiance photo, without any per-page branching.
 */
export interface ProfileTheme {
  isDark: boolean;
  /** Business accent color (already defaulted upstream). */
  accent: string;
  /** Readable text color to place ON the accent (for solid accent chips). */
  onAccent: string;
  /** Soft accent-tinted background for icon chips. */
  accentTint: string;
  accentRing: string;
  /** Frosted-glass panel surface. */
  panel: string;
  /** Slightly stronger glass, for the primary floating action bar. */
  panelStrong: string;
  /** Interactive press affordance shared by every tappable surface. */
  press: string;
  text: string;
  subtext: string;
  muted: string;
  divider: string;
  /** Scrim placed over a background image so glass and text stay legible. */
  scrimColor: string;
}

/** WCAG-relative-luminance pick of black vs white text over a hex color. */
export function readableTextOn(hex: string): string {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return "#0B0B0C";
  const channel = (start: number) => {
    const v = parseInt(normalized.slice(start, start + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.5 ? "#0B0B0C" : "#FFFFFF";
}

export function buildProfileTheme(accent: string, background: ResolvedBackground): ProfileTheme {
  const isDark = background.mode === "dark";

  return {
    isDark,
    accent,
    onAccent: readableTextOn(accent),
    accentTint: isDark ? `${accent}26` : `${accent}1F`,
    accentRing: isDark ? `${accent}59` : `${accent}40`,
    panel: isDark
      ? "bg-white/[0.07] backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/15 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.7)]"
      : "bg-white/70 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-slate-900/[0.06] shadow-[0_12px_40px_-18px_rgba(15,23,42,0.35)]",
    panelStrong: isDark
      ? "bg-white/[0.12] backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/20 shadow-[0_18px_50px_-16px_rgba(0,0,0,0.8)]"
      : "bg-white/80 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-slate-900/[0.08] shadow-[0_18px_50px_-18px_rgba(15,23,42,0.4)]",
    press: "transition-transform duration-200 ease-out active:scale-[0.97]",
    text: isDark ? "text-white" : "text-slate-900",
    subtext: isDark ? "text-white/70" : "text-slate-600",
    muted: isDark ? "text-white/45" : "text-slate-400",
    divider: isDark ? "divide-white/10" : "divide-slate-900/[0.06]",
    scrimColor: isDark ? "rgba(6,6,8,0.55)" : "rgba(255,255,255,0.5)",
  };
}
