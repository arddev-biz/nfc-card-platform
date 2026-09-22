"use client";
import {useSaveCoordinator} from "./SaveCoordinator";

import { useState } from "react";
import {
  GRADIENT_PRESETS,
  GRADIENT_PRESET_ORDER,
  type BackgroundType,
  type BackgroundGradientPreset,
  type BackgroundMode,
} from "@/lib/background";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ImageSlot } from "@/components/admin/BusinessImagesManager";

export interface DesignDraft {
  themeColor: string;
  backgroundType: BackgroundType;
  backgroundColor: string;
  backgroundGradient: BackgroundGradientPreset | "";
  backgroundMode: BackgroundMode;
}

interface DesignPanelProps {
  accentEnabled?:boolean;
  organizationId: string;
  draft: DesignDraft;
  onChange: (fields: Partial<DesignDraft>) => void;
  onSave: (draft: DesignDraft) => Promise<boolean>;
  backgroundImageUrl: string | null;
  onBackgroundImageChange: (url: string | null) => void;
}

const TYPE_OPTIONS: { value: BackgroundType; label: string }[] = [
  { value: "SOLID", label: "Solid color" },
  { value: "GRADIENT", label: "Gradient" },
  { value: "IMAGE", label: "Image" },
];

export function DesignPanel({
  accentEnabled=true,
  organizationId,
  draft,
  onChange,
  onSave,
  backgroundImageUrl,
  onBackgroundImageChange,
}: DesignPanelProps) {
  const coordinated=useSaveCoordinator();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isImageBusy, setIsImageBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    try {
      const saved = await onSave(draft);
      showToast(saved ? "Saved." : "Unable to save design.", saved ? "success" : "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadBackground(file: File) {
    setIsImageBusy(true);
    setImageError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/admin/businesses/${organizationId}/images/background`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setImageError(data.error ?? "Unable to upload background image.");
        return;
      }
      onBackgroundImageChange(data.url);
    } catch {
      setImageError("Unable to upload background image.");
    } finally {
      setIsImageBusy(false);
    }
  }

  async function removeBackground() {
    if (!window.confirm("Remove the background image?")) return;
    setIsImageBusy(true);
    setImageError(null);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/images/background`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setImageError(data.error ?? "Unable to remove background image.");
        return;
      }
      onBackgroundImageChange(null);
    } finally {
      setIsImageBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button type="button" variant="secondary" onClick={() => onChange({
        themeColor: "", backgroundType: "SOLID", backgroundColor: "", backgroundGradient: "", backgroundMode: "LIGHT",
      })}>Use default design (save to apply)</Button>
      <p className="text-xs">Default design uses plain solid/light appearance. Uploaded background images are retained until explicitly removed.</p>
      <div>
        <label className="block text-sm font-medium text-[var(--admin-text)]">Accent Color</label>
        <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">
          Used for theme-colored icons, focus rings and interactive highlights. Card color is separate; verification keeps its own configured color.
        </p>
        {accentEnabled&&<ColorPicker label="Accent Color" allowEmpty value={draft.themeColor} onChange={themeColor=>onChange({themeColor})}/>}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--admin-text)]">Background</label>
        <div className="mt-2 flex gap-2">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ backgroundType: option.value })}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                draft.backgroundType === option.value
                  ? "border-[var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-accent-text)]"
                  : "border-[var(--admin-border)] text-[var(--admin-text-secondary)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {draft.backgroundType === "SOLID" && (
          <ColorPicker label="Solid background color" allowEmpty value={draft.backgroundColor} onChange={backgroundColor=>onChange({backgroundColor})}/>
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
                  draft.backgroundGradient === key
                    ? "ring-[var(--admin-accent)]"
                    : "ring-transparent"
                }`}
                style={{ background: GRADIENT_PRESETS[key].css }}
              />
            ))}
          </div>
        )}

        {draft.backgroundType === "IMAGE" && (
          <div className="mt-3">
            <ImageSlot
              label="Background image"
              hint="JPEG, PNG, or WebP, up to 5MB."
              url={backgroundImageUrl}
              isBusy={isImageBusy}
              error={imageError}
              onUpload={uploadBackground}
              onRemove={removeBackground}
              previewClassName="h-16 w-28 shrink-0 rounded-lg object-cover"
            />
          </div>
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

      {!coordinated&&<Button type="button" disabled={isSaving} onClick={handleSave}>
        {isSaving ? "Saving…" : "Save design"}
      </Button>}
    </div>
  );
}
