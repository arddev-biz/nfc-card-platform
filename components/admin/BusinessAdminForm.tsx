"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface BusinessAdminFormProps {
  organizationId: string;
  initialValues: {
    businessName: string;
    slug: string;
    businessType: string;
  };
}

type FieldErrors = Partial<Record<keyof BusinessAdminFormProps["initialValues"], string[]>>;

export function BusinessAdminForm({ organizationId, initialValues }: BusinessAdminFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [values, setValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [status, setStatus] = useState("Saved");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  function update(field: keyof typeof values, value: string) {
    setStatus("Unsaved changes");
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setIsSaving(true);
    setStatus("Saving…");
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.organization) {
        setStatus("Save failed — changes are not persisted");
        setFieldErrors(data.fieldErrors ?? {});
        showToast(data.error ?? "Unable to save business details.", "error");
        return;
      }

      setValues({
        businessName: data.organization.name,
        slug: data.organization.slug,
        businessType: data.organization.businessType ?? "",
      });
      showToast("Business details saved.");
      setSavedValues({ businessName: data.organization.name, slug: data.organization.slug, businessType: data.organization.businessType ?? "" });
      setStatus("Saved");
      router.refresh();
    } catch {
      setStatus("Save failed — changes are not persisted");
      showToast("Unable to save business details.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p role="status">{status}</p>
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-[var(--admin-text)]">
          Business name
        </label>
        <Input
          id="businessName"
          value={values.businessName}
          onChange={(event) => update("businessName", event.target.value)}
        />
        {fieldErrors.businessName?.[0] && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.businessName[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-[var(--admin-text)]">
          Public profile slug
        </label>
        <Input id="slug" value={values.slug} onChange={(event) => update("slug", event.target.value)} />
        {fieldErrors.slug?.[0] && <p className="mt-1 text-sm text-red-600">{fieldErrors.slug[0]}</p>}
      </div>

      <div>
        <label htmlFor="businessType" className="block text-sm font-medium text-[var(--admin-text)]">
          Business type
        </label>
        <Input
          id="businessType"
          value={values.businessType}
          onChange={(event) => update("businessType", event.target.value)}
        />
        {fieldErrors.businessType?.[0] && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.businessType[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Saving…" : "Save business details"}
      </Button>
      <Button type="button" variant="secondary" disabled={isSaving} onClick={() => {
        setValues(savedValues); setFieldErrors({}); setStatus("Reset to saved values");
      }}>Cancel unsaved changes</Button>
    </form>
  );
}
