"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { LinkType } from "@prisma/client";

export interface LinkLike {
  id: string;
  type: LinkType;
  label: string | null;
  url: string;
  isActive: boolean;
}

interface ReviewsEditorProps {
  organizationId: string;
  reviewsLink: LinkLike | undefined;
  onSaved: (link: LinkLike) => void;
}

export function ReviewsEditor({ organizationId, reviewsLink, onSaved }: ReviewsEditorProps) {
  const { showToast } = useToast();
  const [label, setLabel] = useState(reviewsLink?.label ?? "Leave us a Google Review");
  const [url, setUrl] = useState(reviewsLink?.url ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!dirty) {
      setLabel(reviewsLink?.label ?? "Leave us a Google Review");
      setUrl(reviewsLink?.url ?? "");
    }
  }, [reviewsLink, dirty]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const endpoint = reviewsLink
        ? `/api/admin/businesses/${organizationId}/links/${reviewsLink.id}`
        : `/api/admin/businesses/${organizationId}/links`;
      const method = reviewsLink ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "GOOGLE_REVIEWS", label, value: url, isActive: reviewsLink?.isActive ?? true }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.fieldErrors?.value?.[0] ?? data.fieldErrors?.label?.[0] ?? data.error ?? "Unable to save.");
        showToast(data.error ?? "Unable to save.", "error");
        return;
      }

      const saved: LinkLike = data.link;
      setLabel(saved.label ?? "");
      setUrl(saved.url);
      onSaved(saved);
      setDirty(false);
      showToast("Saved.");
    } catch {
      setError("Unable to save. Changes are not persisted.");
      showToast("Unable to save.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p role="status">{isSaving ? "Saving…" : dirty ? "Unsaved Reviews changes" : "Saved"}</p>
      {error && <p role="alert">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-[var(--admin-text)]">Title</label>
        <Input className="mt-1" value={label} onChange={(e) => { setDirty(true); setLabel(e.target.value); }} />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--admin-text)]">Google Reviews URL</label>
        <Input
          className="mt-1"
          placeholder="https://g.page/r/.../review"
          value={url}
          type="url"
          onChange={(e) => { setDirty(true); setUrl(e.target.value); }}
        />
      </div>
      <Button type="button" disabled={isSaving || !url} onClick={handleSave}>
        {isSaving ? "Saving…" : "Save"}
      </Button>
      <Button type="button" variant="secondary" disabled={isSaving} onClick={() => { setDirty(false); setError(null); }}>Cancel unsaved Reviews changes</Button>
    </div>
  );
}
