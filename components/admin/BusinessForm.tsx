"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { GRADIENT_PRESETS, GRADIENT_PRESET_ORDER } from "@/lib/background";
import { ImageSlot } from "@/components/admin/BusinessImagesManager";

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
  backgroundType: string;
  backgroundColor: string;
  backgroundGradient: string;
  backgroundMode: string;
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
  backgroundType: "",
  backgroundColor: "",
  backgroundGradient: "",
  backgroundMode: "",
};

type FieldErrors = Partial<Record<keyof BusinessFormValues, string[]>>;

interface BusinessFormProps {
  mode: "create" | "edit";
  organizationId?: string;
  initialValues?: Partial<BusinessFormValues>;
  backgroundImageUrl?: string | null;
}

export function BusinessForm({
  mode,
  organizationId,
  initialValues,
  backgroundImageUrl = null,
}: BusinessFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<BusinessFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Background image is uploaded immediately (same as logo/cover),
  // independent of this form's Save button — mirrors
  // BusinessImagesManager's own upload/remove handling exactly, reusing
  // the same API endpoint and the same ImageSlot UI.
  const [isBackgroundImageBusy, setIsBackgroundImageBusy] = useState(false);
  const [backgroundImageError, setBackgroundImageError] = useState<string | null>(null);

  async function handleBackgroundImageUpload(file: File) {
    if (!organizationId) return;
    setIsBackgroundImageBusy(true);
    setBackgroundImageError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/admin/businesses/${organizationId}/images/background`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setBackgroundImageError(data.error ?? "Something went wrong uploading the image.");
        return;
      }
      router.refresh();
    } catch {
      setBackgroundImageError("Something went wrong. Please try again.");
    } finally {
      setIsBackgroundImageBusy(false);
    }
  }

  async function handleBackgroundImageRemove() {
    if (!organizationId) return;
    if (!window.confirm("Remove the background image? This can't be undone.")) return;
    setIsBackgroundImageBusy(true);
    setBackgroundImageError(null);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/images/background`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setBackgroundImageError(data.error ?? "Something went wrong removing the image.");
        return;
      }
      router.refresh();
    } finally {
      setIsBackgroundImageBusy(false);
    }
  }

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

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          Background
        </h2>
        <p className="text-xs text-[var(--admin-text-secondary)]">
          Controls the public profile&apos;s page background. Leave as &ldquo;Default&rdquo; to keep
          the current plain background.
        </p>

        <div>
          <label
            htmlFor="backgroundType"
            className="block text-sm font-medium text-[var(--admin-text)]"
          >
            Background type
          </label>
          <select
            id="backgroundType"
            value={values.backgroundType}
            onChange={(e) => update("backgroundType", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text)] shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Default (plain)</option>
            <option value="SOLID">Solid color</option>
            <option value="GRADIENT">Gradient</option>
            <option value="IMAGE">Image</option>
          </select>
        </div>

        {values.backgroundType === "SOLID" && (
          <div>
            <label
              htmlFor="backgroundColor"
              className="block text-sm font-medium text-[var(--admin-text)]"
            >
              Background color
            </label>
            <Input
              id="backgroundColor"
              placeholder="#F7F7F8"
              value={values.backgroundColor}
              onChange={(e) => update("backgroundColor", e.target.value)}
            />
            {fieldError("backgroundColor") && (
              <p className="mt-1 text-sm text-red-600">{fieldError("backgroundColor")}</p>
            )}
          </div>
        )}

        {values.backgroundType === "GRADIENT" && (
          <div>
            <p className="block text-sm font-medium text-[var(--admin-text)]">Gradient</p>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {GRADIENT_PRESET_ORDER.map((preset) => {
                const isSelected = values.backgroundGradient === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    title={GRADIENT_PRESETS[preset].label}
                    onClick={() => update("backgroundGradient", preset)}
                    className={`h-12 rounded-lg ring-2 transition-all ${
                      isSelected ? "ring-slate-900" : "ring-transparent hover:ring-slate-300"
                    }`}
                    style={{ background: GRADIENT_PRESETS[preset].css }}
                  />
                );
              })}
            </div>
            {fieldError("backgroundGradient") && (
              <p className="mt-1 text-sm text-red-600">{fieldError("backgroundGradient")}</p>
            )}
          </div>
        )}

        {values.backgroundType === "IMAGE" && (
          <div>
            {organizationId ? (
              <ImageSlot
                label="Background image"
                hint="Used on the public profile. JPEG, PNG, or WebP, up to 5MB."
                url={backgroundImageUrl}
                isBusy={isBackgroundImageBusy}
                error={backgroundImageError}
                onUpload={handleBackgroundImageUpload}
                onRemove={handleBackgroundImageRemove}
                previewClassName="h-16 w-28 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <p className="text-xs text-[var(--admin-text-secondary)]">
                Save this business first, then upload a background image here.
              </p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="backgroundMode"
            className="block text-sm font-medium text-[var(--admin-text)]"
          >
            Appearance
          </label>
          <select
            id="backgroundMode"
            value={values.backgroundMode}
            onChange={(e) => update("backgroundMode", e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text)] shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Light (default)</option>
            <option value="LIGHT">Light</option>
            <option value="DARK">Dark</option>
          </select>
          <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">
            Dark switches card and text colors on the public profile for readability against a
            dark background.
          </p>
        </div>
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
