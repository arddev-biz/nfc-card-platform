"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface BusinessImagesManagerProps {
  organizationId: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
}

function ImageSlot({
  label,
  hint,
  url,
  isBusy,
  error,
  onUpload,
  onRemove,
  previewClassName,
}: {
  label: string;
  hint: string;
  url: string | null;
  isBusy: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  previewClassName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-sm font-medium text-[var(--admin-text)]">{label}</p>
      <p className="text-xs text-[var(--admin-text-secondary)]">{hint}</p>

      <div className="mt-2 flex items-center gap-4">
        {url ? (
          // Plain <img> here (not next/image): this is an internal admin
          // preview thumbnail, not the optimized public-facing render —
          // see app/[businessSlug]/page.tsx for the optimized version.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`${label} preview`} className={previewClassName} />
        ) : (
          <div
            className={`flex items-center justify-center border border-dashed border-[var(--admin-border)] text-xs text-[var(--admin-text-secondary)] ${previewClassName}`}
          >
            None
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            {isBusy ? "Uploading…" : url ? "Replace" : "Upload"}
          </Button>
          {url && (
            <Button type="button" variant="ghost" disabled={isBusy} onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function BusinessImagesManager({
  organizationId,
  logoUrl,
  coverImageUrl,
}: BusinessImagesManagerProps) {
  const router = useRouter();
  const [busyKind, setBusyKind] = useState<"logo" | "cover" | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  async function handleUpload(kind: "logo" | "cover", file: File) {
    setBusyKind(kind);
    const setError = kind === "logo" ? setLogoError : setCoverError;
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/businesses/${organizationId}/images/${kind}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Something went wrong uploading the image.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyKind(null);
    }
  }

  async function handleRemove(kind: "logo" | "cover") {
    if (!window.confirm(`Remove the ${kind}? This can't be undone.`)) return;

    setBusyKind(kind);
    const setError = kind === "logo" ? setLogoError : setCoverError;
    setError(null);

    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/images/${kind}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong removing the image.");
        return;
      }
      router.refresh();
    } finally {
      setBusyKind(null);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
        Images
      </h2>

      <div className="mt-4 space-y-6">
        <ImageSlot
          label="Logo"
          hint="Square image recommended. JPEG, PNG, or WebP, up to 5MB."
          url={logoUrl}
          isBusy={busyKind === "logo"}
          error={logoError}
          onUpload={(file) => handleUpload("logo", file)}
          onRemove={() => handleRemove("logo")}
          previewClassName="h-16 w-16 shrink-0 rounded-full object-cover"
        />

        <ImageSlot
          label="Cover image"
          hint="Wide banner image. JPEG, PNG, or WebP, up to 5MB."
          url={coverImageUrl}
          isBusy={busyKind === "cover"}
          error={coverError}
          onUpload={(file) => handleUpload("cover", file)}
          onRemove={() => handleRemove("cover")}
          previewClassName="h-16 w-28 shrink-0 rounded-lg object-cover"
        />
      </div>
    </div>
  );
}
