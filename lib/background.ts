import type { CSSProperties } from "react";
import type { BackgroundType, BackgroundGradientPreset, BackgroundMode } from "@prisma/client";

export const GRADIENT_PRESETS: Record<BackgroundGradientPreset, { label: string; css: string }> = {
  INDIGO: { label: "Indigo", css: "linear-gradient(135deg, #4F46E5, #818CF8)" },
  PURPLE: { label: "Purple", css: "linear-gradient(135deg, #7C3AED, #C084FC)" },
  BLUE: { label: "Blue", css: "linear-gradient(135deg, #2563EB, #60A5FA)" },
  SUNSET: { label: "Sunset", css: "linear-gradient(135deg, #F97316, #EC4899)" },
  EMERALD: { label: "Emerald", css: "linear-gradient(135deg, #059669, #34D399)" },
  ROSE: { label: "Rose", css: "linear-gradient(135deg, #E11D48, #FB7185)" },
  DARK: { label: "Dark", css: "linear-gradient(135deg, #111827, #374151)" },
};

export const GRADIENT_PRESET_ORDER: BackgroundGradientPreset[] = [
  "INDIGO",
  "PURPLE",
  "BLUE",
  "SUNSET",
  "EMERALD",
  "ROSE",
  "DARK",
];

const LEGACY_BACKGROUND_COLOR = "#F7F7F8";

export interface BackgroundConfig {
  backgroundType: BackgroundType | null;
  backgroundColor: string | null;
  backgroundGradient: BackgroundGradientPreset | null;
  backgroundImageUrl: string | null;
  backgroundMode: BackgroundMode | null;
}

export interface ResolvedBackground {
  style: CSSProperties;
  /** "dark" only when explicitly configured — legacy/unconfigured profiles are always "light". */
  mode: "light" | "dark";
  hasImage: boolean;
}

/**
 * Turns a profile's background fields into an actual renderable style.
 * Falls back to the original plain light background whenever nothing
 * has been configured, or configuration is incomplete (e.g. type=IMAGE
 * but no image ever uploaded) — this is what keeps every pre-Step-2
 * business profile looking exactly as it did before this feature
 * existed.
 */
export function resolveBackground(config: BackgroundConfig): ResolvedBackground {
  const mode: "light" | "dark" = config.backgroundMode === "DARK" ? "dark" : "light";

  if (config.backgroundType === "IMAGE" && config.backgroundImageUrl) {
    return {
      mode,
      hasImage: true,
      style: {
        backgroundImage: `url(${config.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      },
    };
  }

  if (config.backgroundType === "GRADIENT" && config.backgroundGradient) {
    return {
      mode,
      hasImage: false,
      style: { background: GRADIENT_PRESETS[config.backgroundGradient].css },
    };
  }

  if (config.backgroundType === "SOLID" && config.backgroundColor) {
    return { mode, hasImage: false, style: { backgroundColor: config.backgroundColor } };
  }

  return { mode: "light", hasImage: false, style: { backgroundColor: LEGACY_BACKGROUND_COLOR } };
}
