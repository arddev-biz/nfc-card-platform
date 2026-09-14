"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ImageSlot } from "@/components/admin/BusinessImagesManager";

interface DraftProfile {
  displayName: string;
  bio: string;
  phone: string;
  address: string;
  googleMapsUrl: string;
}

interface SaveFieldsFn {
  (fields: Partial<DraftProfile>): Promise<boolean>;
}

/** Shared label wrapper — every editor in this file uses the same field pattern. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--admin-text)]">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function useBlockSave(onSave: SaveFieldsFn) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  async function save(fields: Partial<DraftProfile>) {
    setIsSaving(true);
    try {
      const ok = await onSave(fields);
      showToast(ok ? "Saved." : "Unable to save changes.", ok ? "success" : "error");
      return ok;
    } finally {
      setIsSaving(false);
    }
  }

  return { save, isSaving };
}

export function HeaderEditor({
  organizationId,
  draft,
  onChange,
  onSave,
  logoUrl,
  coverImageUrl,
  onImagesChange,
}: {
  organizationId: string;
  draft: DraftProfile;
  onChange: (fields: Partial<DraftProfile>) => void;
  onSave: SaveFieldsFn;
  logoUrl: string | null;
  coverImageUrl: string | null;
  onImagesChange: (fields: { logoUrl?: string | null; coverImageUrl?: string | null }) => void;
}) {
  const { save, isSaving } = useBlockSave(onSave);
  const { showToast } = useToast();
  const [busyKind, setBusyKind] = useState<"logo" | "cover" | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  async function handleUpload(kind: "logo" | "cover", file: File) {
    setBusyKind(kind);
    (kind === "logo" ? setLogoError : setCoverError)(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/admin/businesses/${organizationId}/images/${kind}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        (kind === "logo" ? setLogoError : setCoverError)(data.error ?? "Unable to upload image.");
        return;
      }
      onImagesChange(kind === "logo" ? { logoUrl: data.url } : { coverImageUrl: data.url });
      showToast("Image updated.");
    } finally {
      setBusyKind(null);
    }
  }

  async function handleRemove(kind: "logo" | "cover") {
    if (!window.confirm("Remove this image?")) return;
    setBusyKind(kind);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/images/${kind}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        (kind === "logo" ? setLogoError : setCoverError)(data.error ?? "Unable to remove image.");
        return;
      }
      onImagesChange(kind === "logo" ? { logoUrl: null } : { coverImageUrl: null });
      showToast("Image removed.");
    } finally {
      setBusyKind(null);
    }
  }

  return (
    <div className="space-y-4">
      <ImageSlot
        label="Logo"
        hint="Square image, shown as a circle overlapping the cover. JPEG, PNG, or WebP, up to 5MB."
        url={logoUrl}
        isBusy={busyKind === "logo"}
        error={logoError}
        onUpload={(file) => handleUpload("logo", file)}
        onRemove={() => handleRemove("logo")}
        previewClassName="h-16 w-16 shrink-0 rounded-full object-cover"
      />
      <ImageSlot
        label="Cover image"
        hint="Wide banner image at the top of your profile. JPEG, PNG, or WebP, up to 5MB."
        url={coverImageUrl}
        isBusy={busyKind === "cover"}
        error={coverError}
        onUpload={(file) => handleUpload("cover", file)}
        onRemove={() => handleRemove("cover")}
        previewClassName="h-16 w-28 shrink-0 rounded-lg object-cover"
      />

      <Field label="Display name">
        <Input value={draft.displayName} onChange={(e) => onChange({ displayName: e.target.value })} />
      </Field>
      <Button
        type="button"
        disabled={isSaving}
        onClick={() => save({ displayName: draft.displayName })}
      >
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

export function BioEditor({
  draft,
  onChange,
  onSave,
}: {
  draft: DraftProfile;
  onChange: (fields: Partial<DraftProfile>) => void;
  onSave: SaveFieldsFn;
}) {
  const { save, isSaving } = useBlockSave(onSave);

  return (
    <div className="space-y-4">
      <Field label="Description">
        <Textarea
          rows={4}
          value={draft.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          placeholder="A short description shown under your business name."
        />
      </Field>
      <Button type="button" disabled={isSaving} onClick={() => save({ bio: draft.bio })}>
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

export function ContactEditor({
  draft,
  onChange,
  onSave,
  hasWhatsappLink,
  onOpenLinks,
}: {
  draft: DraftProfile;
  onChange: (fields: Partial<DraftProfile>) => void;
  onSave: SaveFieldsFn;
  hasWhatsappLink: boolean;
  onOpenLinks: () => void;
}) {
  const { save, isSaving } = useBlockSave(onSave);

  return (
    <div className="space-y-4">
      <Field label="Phone number">
        <Input
          value={draft.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="+355 69 123 4567"
        />
        <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">
          Powers the Call button. Leave blank to hide it.
        </p>
      </Field>

      <Field label="WhatsApp">
        <p className="text-sm text-[var(--admin-text-secondary)]">
          {hasWhatsappLink ? "A WhatsApp number is configured." : "No WhatsApp number configured yet."}
        </p>
        <Button type="button" variant="secondary" className="mt-2" onClick={onOpenLinks}>
          {hasWhatsappLink ? "Edit WhatsApp" : "Add WhatsApp"}
        </Button>
      </Field>

      <Button type="button" disabled={isSaving} onClick={() => save({ phone: draft.phone })}>
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

export function LocationEditor({
  draft,
  onChange,
  onSave,
}: {
  draft: DraftProfile;
  onChange: (fields: Partial<DraftProfile>) => void;
  onSave: SaveFieldsFn;
}) {
  const { save, isSaving } = useBlockSave(onSave);

  return (
    <div className="space-y-4">
      <Field label="Address">
        <Input value={draft.address} onChange={(e) => onChange({ address: e.target.value })} />
      </Field>
      <Field label="Google Maps URL">
        <Input
          placeholder="https://maps.google.com/..."
          value={draft.googleMapsUrl}
          onChange={(e) => onChange({ googleMapsUrl: e.target.value })}
        />
        <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">
          Powers the Directions button. Leave blank to hide it.
        </p>
      </Field>
      <Button
        type="button"
        disabled={isSaving}
        onClick={() => save({ address: draft.address, googleMapsUrl: draft.googleMapsUrl })}
      >
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
