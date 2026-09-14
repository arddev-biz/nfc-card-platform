"use client";

import { useState } from "react";
import type { LinkType } from "@prisma/client";
import { LINK_TYPE_META, LINK_TYPE_ORDER } from "@/lib/linkTypes";
import { Input } from "@/components/ui/Input";
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
}

const EMPTY_FORM: FormState = { id: null, type: "INSTAGRAM", label: "", value: "" };

export function LinksEditor({ organizationId, links, onChange }: LinksEditorProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleSaveForm() {
    if (!form) return;
    setBusyId(form.id ?? "new");
    try {
      const endpoint = form.id
        ? `/api/admin/businesses/${organizationId}/links/${form.id}`
        : `/api/admin/businesses/${organizationId}/links`;
      const response = await fetch(endpoint, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, label: form.label, value: form.value, isActive: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showToast(data.error ?? "Unable to save link.", "error");
        return;
      }
      const saved: LinkLike = data.link;
      onChange(form.id ? links.map((l) => (l.id === saved.id ? saved : l)) : [...links, saved]);
      showToast("Saved.");
      setForm(null);
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
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const previous = links;
    const reordered = [...links];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
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
    }
  }

  return (
    <div className="space-y-4">
      {links.length === 0 && (
        <p className="text-sm text-[var(--admin-text-secondary)]">No links yet.</p>
      )}

      <ul className="space-y-2">
        {links.map((link, index) => (
          <li
            key={link.id}
            className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] p-2"
          >
            <div className="flex flex-col">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => handleMove(index, -1)}
                className="rounded border border-[var(--admin-border)] px-1 text-xs disabled:opacity-30"
              >
                &uarr;
              </button>
              <button
                type="button"
                disabled={index === links.length - 1}
                onClick={() => handleMove(index, 1)}
                className="mt-0.5 rounded border border-[var(--admin-border)] px-1 text-xs disabled:opacity-30"
              >
                &darr;
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone="gray">{LINK_TYPE_META[link.type].label}</Badge>
                <span className="truncate text-sm font-medium text-[var(--admin-text)]">{link.label}</span>
              </div>
              <p className="truncate text-xs text-[var(--admin-text-secondary)]">{link.url}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              disabled={busyId === link.id}
              onClick={() => setForm({ id: link.id, type: link.type, label: link.label ?? "", value: link.url })}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busyId === link.id}
              onClick={() => handleDelete(link)}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>

      {form ? (
        <div className="space-y-3 rounded-lg border border-[var(--admin-border)] p-3">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as LinkType })}
            className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text)]"
          >
            {LINK_TYPE_ORDER.map((type) => (
              <option key={type} value={type}>
                {LINK_TYPE_META[type].label}
              </option>
            ))}
          </select>
          <Input
            placeholder="Label"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <Input
            placeholder={LINK_TYPE_META[form.type].placeholder}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
          <div className="flex gap-2">
            <Button type="button" disabled={busyId !== null} onClick={handleSaveForm}>
              {busyId ? "Saving…" : "Save link"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="secondary" onClick={() => setForm(EMPTY_FORM)}>
          + Add Link
        </Button>
      )}
    </div>
  );
}
