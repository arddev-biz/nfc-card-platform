"use client";

import { FormEvent, useState } from "react";
import { LinkType } from "@prisma/client";
import { LINK_TYPE_META, LINK_TYPE_ORDER } from "@/lib/linkTypes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { LinkLike } from "@/components/admin/profile-builder/ReviewsEditor";

export interface ProfileLinkFormValues {
  type: LinkType;
  label: string;
  value: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<"type" | "label" | "value", string[]>>;

interface ProfileLinkFormProps {
  organizationId: string;
  mode: "create" | "edit";
  linkId?: string;
  initialValues?: Partial<ProfileLinkFormValues>;
  onCancel: () => void;
  onSaved: (link: LinkLike) => void;
}

const emptyValues: ProfileLinkFormValues = {
  type: "INSTAGRAM",
  label: "",
  value: "",
  isActive: true,
};

export function ProfileLinkForm({
  organizationId,
  mode,
  linkId,
  initialValues,
  onCancel,
  onSaved,
}: ProfileLinkFormProps) {
  const [values, setValues] = useState<ProfileLinkFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const meta = LINK_TYPE_META[values.type];

  function update<K extends keyof ProfileLinkFormValues>(key: K, value: ProfileLinkFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const endpoint =
      mode === "create"
        ? `/api/admin/businesses/${organizationId}/links`
        : `/api/admin/businesses/${organizationId}/links/${linkId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setGeneralError(data.error ?? "Something went wrong. Please try again.");
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }

      if (!data.link) { setGeneralError("The server did not return the saved link."); return; }
      onSaved(data.link);
    } catch {
      setGeneralError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const valueInputType =
    meta.valueKind === "email" ? "email" : meta.valueKind === "url" ? "url" : "tel";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4"
    >
      <p role="status">{isSubmitting ? "Saving…" : "Unsaved link changes"}</p>
      <p className="text-xs">Phone and Maps links are legacy fallbacks; profile fields take precedence. WhatsApp and Reviews allow one record per type; edit the existing record instead of adding a duplicate.</p>
      {generalError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {generalError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="link-type" className="block text-sm font-medium text-[var(--admin-text)]">
            Link type
          </label>
          <select
            id="link-type"
            value={values.type}
            onChange={(e) => update("type", e.target.value as LinkType)}
            className="mt-1 block w-full rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm text-[var(--admin-text)] shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {LINK_TYPE_ORDER.map((type) => (
              <option key={type} value={type}>
                {LINK_TYPE_META[type].label}
              </option>
            ))}
          </select>
          {fieldErrors.type && <p className="mt-1 text-sm text-red-600">{fieldErrors.type[0]}</p>}
        </div>

        <div>
          <label htmlFor="link-label" className="block text-sm font-medium text-[var(--admin-text)]">
            Label
          </label>
          <Input
            id="link-label"
            placeholder={meta.defaultLabel}
            value={values.label}
            onChange={(e) => update("label", e.target.value)}
          />
          <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">
            Leave blank to use &ldquo;{meta.defaultLabel}&rdquo;.
          </p>
          {fieldErrors.label && <p className="mt-1 text-sm text-red-600">{fieldErrors.label[0]}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="link-value" className="block text-sm font-medium text-[var(--admin-text)]">
          {meta.valueKind === "phone" ? "Phone number" : meta.valueKind === "email" ? "Email address" : "URL"}
        </label>
        <Input
          id="link-value"
          type={valueInputType}
          placeholder={meta.placeholder}
          value={values.value}
          onChange={(e) => update("value", e.target.value)}
        />
        {fieldErrors.value && <p className="mt-1 text-sm text-red-600">{fieldErrors.value[0]}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => update("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-[var(--admin-border)]"
        />
        Active (visible on the public profile)
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : mode === "create" ? "Add link" : "Save link"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
