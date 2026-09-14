"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileLink } from "@prisma/client";
import { LINK_TYPE_META } from "@/lib/linkTypes";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProfileLinkForm } from "@/components/admin/ProfileLinkForm";

interface ProfileLinksManagerProps {
  organizationId: string;
  links: ProfileLink[];
}

export function ProfileLinksManager({ organizationId, links }: ProfileLinksManagerProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [busyLinkId, setBusyLinkId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSaved() {
    setIsAdding(false);
    setEditingLinkId(null);
    router.refresh();
  }

  async function handleDelete(link: ProfileLink) {
    if (!window.confirm(`Delete the "${link.label}" link? This cannot be undone.`)) return;

    setBusyLinkId(link.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/links/${link.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong deleting the link.");
        return;
      }
      router.refresh();
    } finally {
      setBusyLinkId(null);
    }
  }

  async function handleToggleActive(link: ProfileLink) {
    setBusyLinkId(link.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/links/${link.id}/active`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !link.isActive }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong updating the link.");
        return;
      }
      router.refresh();
    } finally {
      setBusyLinkId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= links.length) return;

    const reordered = [...links];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const orderedIds = reordered.map((l) => l.id);

    setBusyLinkId(links[index].id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/links/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong reordering links.");
        return;
      }
      router.refresh();
    } finally {
      setBusyLinkId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          Profile Links
        </h2>
        {!isAdding && (
          <Button type="button" variant="secondary" onClick={() => setIsAdding(true)}>
            Add link
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {isAdding && (
        <div className="mt-4">
          <ProfileLinkForm
            organizationId={organizationId}
            mode="create"
            onCancel={() => setIsAdding(false)}
            onSaved={handleSaved}
          />
        </div>
      )}

      {links.length === 0 && !isAdding ? (
        <p className="mt-4 text-sm text-[var(--admin-text-secondary)]">
          No links yet. Add Instagram, WhatsApp, Google Reviews, and more so customers have
          somewhere to go from the public profile.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--admin-border)]">
          {links.map((link, index) => (
            <li key={link.id} className="py-3">
              {editingLinkId === link.id ? (
                <ProfileLinkForm
                  organizationId={organizationId}
                  mode="edit"
                  linkId={link.id}
                  initialValues={{
                    type: link.type,
                    label: link.label ?? "",
                    value: link.url,
                    isActive: link.isActive,
                  }}
                  onCancel={() => setEditingLinkId(null)}
                  onSaved={handleSaved}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--admin-text)]">
                        {LINK_TYPE_META[link.type].label}
                      </span>
                      <Badge tone={link.isActive ? "green" : "gray"}>
                        {link.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-[var(--admin-text-secondary)]">{link.label}</p>
                    <p className="truncate text-xs text-[var(--admin-text-secondary)]">{link.url}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={index === 0 || busyLinkId === link.id}
                      onClick={() => handleMove(index, -1)}
                      className="rounded border border-[var(--admin-border)] px-2 py-1 text-xs text-[var(--admin-text-secondary)] disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={index === links.length - 1 || busyLinkId === link.id}
                      onClick={() => handleMove(index, 1)}
                      className="rounded border border-[var(--admin-border)] px-2 py-1 text-xs text-[var(--admin-text-secondary)] disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busyLinkId === link.id}
                      onClick={() => handleToggleActive(link)}
                    >
                      {link.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busyLinkId === link.id}
                      onClick={() => setEditingLinkId(link.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busyLinkId === link.id}
                      onClick={() => handleDelete(link)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
