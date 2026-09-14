"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { LinkType } from "@prisma/client";

export interface LinkLike {
  id: string;
  type: LinkType;
  label: string | null;
  url: string;
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

  async function handleSave() {
    setIsSaving(true);
    try {
      const endpoint = reviewsLink
        ? `/api/admin/businesses/${organizationId}/links/${reviewsLink.id}`
        : `/api/admin/businesses/${organizationId}/links`;
      const method = reviewsLink ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "GOOGLE_REVIEWS", label, value: url, isActive: true }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(data.error ?? "Unable to save.", "error");
        return;
      }

      onSaved(data.link);
      showToast("Saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--admin-text)]">Title</label>
        <Input className="mt-1" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--admin-text)]">Google Reviews URL</label>
        <Input
          className="mt-1"
          placeholder="https://g.page/r/.../review"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <Button type="button" disabled={isSaving || !url} onClick={handleSave}>
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
