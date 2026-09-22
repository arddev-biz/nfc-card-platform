"use client";

import { useState, useRef } from "react";
import { SortableList } from "./SortableList";
import type { LinkType } from "@prisma/client";
import { LINK_TYPE_META } from "@/lib/linkTypes";
import { ProfileLinkForm } from "@/components/admin/ProfileLinkForm";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import type { LinkLike } from "@/components/admin/profile-builder/ReviewsEditor";

interface LinksEditorProps {
  organizationId: string;
  links: LinkLike[];
  onChange: (links: LinkLike[]) => void;
}

interface FormState {
  id: string | null;
  type: LinkType;
  label: string;
  value: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { id: null, type: "INSTAGRAM", label: "", value: "", isActive: true };

export function LinksEditor({ organizationId, links, onChange }: LinksEditorProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const ordering = useRef(false);

  async function handleToggleActive(link: LinkLike) {
    setBusyId(link.id);
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/links/${link.id}/active`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !link.isActive }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data.error ?? "Unable to update link.", "error");
        return;
      }
      onChange(links.map((item) => (item.id === link.id ? data.link : item)));
    } catch {
      showToast("Unable to update link.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(link: LinkLike) {
    if (!window.confirm(`Delete "${link.label}"?`)) return;
    setBusyId(link.id);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/links/${link.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.error ?? "Unable to delete link.", "error");
        return;
      }
      onChange(links.filter((l) => l.id !== link.id));
      showToast("Link deleted.");
    } catch {
      showToast("Unable to delete link.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReorder(reordered: LinkLike[]) {
    if (ordering.current || busyId !== null) return;
    ordering.current = true;
    setBusyId("@order");
    const previous = links;
    onChange(reordered);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/links/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((l) => l.id) }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        onChange(previous);
        showToast(data.error ?? "Unable to save the new order.", "error");
      }
    } catch {
      onChange(previous);
      showToast("Unable to save the new order.", "error");
    } finally {
      ordering.current = false;
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {links.length === 0 && (
        <p className="text-sm text-[var(--admin-text-secondary)]">No links yet.</p>
      )}

      <SortableList items={links} label={() => "link"} disabled={busyId !== null} onOrder={next => void handleReorder(next)}>
        {(link) => (
          <div
            key={link.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--admin-border)] p-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone="gray">{LINK_TYPE_META[link.type].label}</Badge>
                <Badge tone={link.isActive ? "green" : "gray"}>
                  {link.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="truncate text-sm font-medium text-[var(--admin-text)]">{link.label}</span>
              </div>
              <p className="truncate text-xs text-[var(--admin-text-secondary)]">{link.url}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              disabled={busyId !== null}
              onClick={() => handleToggleActive(link)}
            >
              {link.isActive ? "Disable" : "Enable"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busyId !== null}
              onClick={() => setForm({ id: link.id, type: link.type, label: link.label ?? "", value: link.url, isActive: link.isActive })}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busyId !== null}
              onClick={() => handleDelete(link)}
            >
              Delete
            </Button>
          </div>
        )}
      </SortableList>

      {form ? (
        <ProfileLinkForm
          key={form.id ?? "new"}
          organizationId={organizationId}
          mode={form.id ? "edit" : "create"}
          linkId={form.id ?? undefined}
          initialValues={form}
          onCancel={() => setForm(null)}
          onSaved={(saved) => {
            onChange(form.id ? links.map((link) => link.id === saved.id ? saved : link) : [...links, saved]);
            setForm(null);
            showToast("Link saved.");
          }}
        />
      ) : (
        <Button type="button" variant="secondary" onClick={() => setForm(EMPTY_FORM)}>
          + Add Link
        </Button>
      )}
    </div>
  );
}
