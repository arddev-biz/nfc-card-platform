"use client";

import { useState } from "react";
import type { BackgroundType, BackgroundGradientPreset, BackgroundMode } from "@prisma/client";
import { GRADIENT_PRESETS, GRADIENT_PRESET_ORDER } from "@/lib/background";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export interface DesignDraft {
  themeColor: string;
  backgroundType: BackgroundType;
  backgroundColor: string;
  backgroundGradient: BackgroundGradientPreset | "";
  backgroundMode: BackgroundMode;
}

interface DesignPanelProps {
  organizationId: string;
  draft: DesignDraft;
  onChange: (fields: Partial<DesignDraft>) => void;
  hasBackgroundImage: boolean;
}

const TYPE_OPTIONS: { value: BackgroundType; label: string }[] = [
  { value: "SOLID", label: "Solid color" },
  { value: "GRADIENT", label: "Gradient" },
  { value: "IMAGE", label: "Image" },
];

export function DesignPanel({ organizationId, draft, onChange, hasBackgroundImage }: DesignPanelProps) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/profile-content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeColor: draft.themeColor,
          backgroundType: draft.backgroundType,
          backgroundColor: draft.backgroundType === "SOLID" ? draft.backgroundColor : undefined,
          backgroundGradient: draft.backgroundType === "GRADIENT" ? draft.backgroundGradient : undefined,
          backgroundMode: draft.backgroundMode,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data.error ?? "Unable to save design.", "error");
        return;
      }
      showToast("Saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--admin-text)]">Theme color</label>
        <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">
          Used for buttons, icons, and highlights throughout your profile.
        </p>
        <Input
          className="mt-2"
          placeholder="#4F46E5"
          value={draft.themeColor}
          onChange={(e) => onChange({ themeColor: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--admin-text)]">Background</label>
        <div className="mt-2 flex gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ backgroundType: opt.value })}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                draft.backgroundType === opt.value
                  ? "border-[var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-accent-text)]"
                  : "border-[var(--admin-border)] text-[var(--admin-text-secondary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {draft.backgroundType === "SOLID" && (
          <Input
            className="mt-3"
            placeholder="#F7F7F8"
            value={draft.backgroundColor}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
          />
        )}

        {draft.backgroundType === "GRADIENT" && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {GRADIENT_PRESET_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ backgroundGradient: key })}
                title={GRADIENT_PRESETS[key].label}
                className={`h-12 rounded-lg ring-2 transition-all ${
                  draft.backgroundGradient === key ? "ring-[var(--admin-accent)]" : "ring-transparent"
                }`}
                style={{ background: GRADIENT_PRESETS[key].css }}
              />
            ))}
          </div>
        )}

        {draft.backgroundType === "IMAGE" && (
          <p className="mt-3 text-xs text-[var(--admin-text-secondary)]">
            {hasBackgroundImage ? "A background image is set." : "No background image uploaded yet."}{" "}
            Uploaded in Business Details using the existing image system — it appears here
            immediately once set.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--admin-text)]">Appearance</label>
        <div className="mt-2 flex gap-2">
          {(["LIGHT", "DARK"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ backgroundMode: mode })}
              className={`rounded-full border px-3 py-1.5 text-sm capitalize ${
                draft.backgroundMode === mode
                  ? "border-[var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-accent-text)]"
                  : "border-[var(--admin-border)] text-[var(--admin-text-secondary)]"
              }`}
            >
              {mode.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <Button type="button" disabled={isSaving} onClick={handleSave}>
        {isSaving ? "Saving…" : "Save design"}
      </Button>
    </div>
  );
}
