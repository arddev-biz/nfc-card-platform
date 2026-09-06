"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export interface BusinessFormValues {
  businessName: string;
  slug: string;
  businessType: string;
  bio: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  googleMapsUrl: string;
  displayName: string;
  themeColor: string;
}

const emptyValues: BusinessFormValues = {
  businessName: "",
  slug: "",
  businessType: "",
  bio: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  address: "",
  googleMapsUrl: "",
  displayName: "",
  themeColor: "",
};

type FieldErrors = Partial<Record<keyof BusinessFormValues, string[]>>;

interface BusinessFormProps {
  mode: "create" | "edit";
  organizationId?: string;
  initialValues?: Partial<BusinessFormValues>;
}

export function BusinessForm({ mode, organizationId, initialValues }: BusinessFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<BusinessFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof BusinessFormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const endpoint =
      mode === "create" ? "/api/admin/businesses" : `/api/admin/businesses/${organizationId}`;
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
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        return;
      }

      if (mode === "create") {
        router.push(`/admin/businesses/${data.organization.id}?created=1`);
        return;
      }

      setSuccessMessage("Changes saved.");
      router.refresh();
    } catch {
      setGeneralError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function fieldError(key: keyof BusinessFormValues): string | undefined {
    return fieldErrors[key]?.[0];
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {generalError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {generalError}
        </p>
      )}
      {successMessage && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          Business Information
        </h2>

        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-[var(--admin-text)]">
            Business name *
          </label>
          <Input
            id="businessName"
            required
            value={values.businessName}
            onChange={(e) => update("businessName", e.target.value)}
          />
          {fieldError("businessName") && (
            <p className="mt-1 text-sm text-red-600">{fieldError("businessName")}</p>
          )}
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-[var(--admin-text)]">
            Business slug
          </label>
          <Input
            id="slug"
            placeholder="Leave blank to auto-generate from the business name"
            value={values.slug}
            onChange={(e) => update("slug", e.target.value)}
          />
          <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">
            Used for the public profile URL later (e.g. yoursite.com/{values.slug || "business-name"}).
          </p>
          {fieldError("slug") && <p className="mt-1 text-sm text-red-600">{fieldError("slug")}</p>}
        </div>

        <div>
          <label htmlFor="businessType" className="block text-sm font-medium text-[var(--admin-text)]">
            Business type
          </label>
          <Input
            id="businessType"
            placeholder="e.g. Restaurant, Salon, Retail"
            value={values.businessType}
            onChange={(e) => update("businessType", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-[var(--admin-text)]">
            Description / bio
          </label>
          <Textarea
            id="bio"
            rows={3}
            value={values.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
          {fieldError("bio") && <p className="mt-1 text-sm text-red-600">{fieldError("bio")}</p>}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          Contact Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[var(--admin-text)]">
              Phone
            </label>
            <Input
              id="phone"
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            {fieldError("phone") && <p className="mt-1 text-sm text-red-600">{fieldError("phone")}</p>}
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-[var(--admin-text)]">
              WhatsApp
            </label>
            <Input
              id="whatsapp"
              value={values.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
            />
            {fieldError("whatsapp") && (
              <p className="mt-1 text-sm text-red-600">{fieldError("whatsapp")}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--admin-text)]">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
            />
            {fieldError("email") && <p className="mt-1 text-sm text-red-600">{fieldError("email")}</p>}
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-[var(--admin-text)]">
              Website
            </label>
            <Input
              id="website"
              placeholder="https://"
              value={values.website}
              onChange={(e) => update("website", e.target.value)}
            />
            {fieldError("website") && (
              <p className="mt-1 text-sm text-red-600">{fieldError("website")}</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">Location</h2>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-[var(--admin-text)]">
            Address
          </label>
          <Input
            id="address"
            value={values.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="googleMapsUrl" className="block text-sm font-medium text-[var(--admin-text)]">
            Google Maps URL
          </label>
          <Input
            id="googleMapsUrl"
            placeholder="https://"
            value={values.googleMapsUrl}
            onChange={(e) => update("googleMapsUrl", e.target.value)}
          />
          {fieldError("googleMapsUrl") && (
            <p className="mt-1 text-sm text-red-600">{fieldError("googleMapsUrl")}</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">Profile</h2>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-[var(--admin-text)]">
            Display name
          </label>
          <Input
            id="displayName"
            placeholder="Defaults to the business name if left blank"
            value={values.displayName}
            onChange={(e) => update("displayName", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="themeColor" className="block text-sm font-medium text-[var(--admin-text)]">
            Theme color
          </label>
          <Input
            id="themeColor"
            placeholder="#4F46E5"
            value={values.themeColor}
            onChange={(e) => update("themeColor", e.target.value)}
          />
          {fieldError("themeColor") && (
            <p className="mt-1 text-sm text-red-600">{fieldError("themeColor")}</p>
          )}
        </div>

        <p className="text-xs text-[var(--admin-text-secondary)]">
          Logo and cover image upload will be added in a later phase.
        </p>
      </section>

      <div className="flex items-center gap-3 border-t border-[var(--admin-border)] pt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Create business"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/businesses")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
