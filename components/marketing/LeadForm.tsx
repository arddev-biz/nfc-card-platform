"use client";

import { FormEvent, useState } from "react";
import { GlassPanel } from "@/components/marketing/GlassPanel";

interface FormValues {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  businessType: string;
  message: string;
}

const emptyValues: FormValues = {
  name: "",
  businessName: "",
  phone: "",
  email: "",
  businessType: "",
  message: "",
};

type FieldErrors = Partial<Record<keyof FormValues, string[]>>;

const fieldClass =
  "mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-brand-offwhite placeholder:text-brand-offwhite/30 focus:border-brand-lime focus:outline-none focus:ring-1 focus:ring-brand-lime";
const labelClass = "block text-sm font-medium text-brand-offwhite/80";

export function LeadForm() {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function update<K extends keyof FormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || isSubmitted) return; // guards against accidental duplicate submission

    setGeneralError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setGeneralError(data.error ?? "Something went wrong. Please try again.");
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setGeneralError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <GlassPanel className="mx-auto max-w-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-brand-offwhite">Thanks — request received!</h2>
        <p className="mt-2 text-sm text-brand-offwhite/70">
          We&apos;ll be in touch shortly to set up your NFC card and profile.
        </p>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="mx-auto max-w-lg p-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {generalError && (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {generalError}
          </p>
        )}

        <div>
          <label htmlFor="lead-name" className={labelClass}>
            Your name *
          </label>
          <input
            id="lead-name"
            className={fieldClass}
            required
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
          />
          {fieldErrors.name && <p className="mt-1 text-sm text-red-300">{fieldErrors.name[0]}</p>}
        </div>

        <div>
          <label htmlFor="lead-business" className={labelClass}>
            Business name *
          </label>
          <input
            id="lead-business"
            className={fieldClass}
            required
            value={values.businessName}
            onChange={(e) => update("businessName", e.target.value)}
          />
          {fieldErrors.businessName && (
            <p className="mt-1 text-sm text-red-300">{fieldErrors.businessName[0]}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lead-phone" className={labelClass}>
              Phone *
            </label>
            <input
              id="lead-phone"
              className={fieldClass}
              required
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            {fieldErrors.phone && <p className="mt-1 text-sm text-red-300">{fieldErrors.phone[0]}</p>}
          </div>

          <div>
            <label htmlFor="lead-email" className={labelClass}>
              Email
            </label>
            <input
              id="lead-email"
              type="email"
              className={fieldClass}
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-red-300">{fieldErrors.email[0]}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="lead-type" className={labelClass}>
            Business type
          </label>
          <input
            id="lead-type"
            placeholder="e.g. Restaurant, Salon, Retail"
            className={fieldClass}
            value={values.businessType}
            onChange={(e) => update("businessType", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="lead-message" className={labelClass}>
            What do you need?
          </label>
          <textarea
            id="lead-message"
            rows={3}
            className={fieldClass}
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
          />
          {fieldErrors.message && (
            <p className="mt-1 text-sm text-red-300">{fieldErrors.message[0]}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-brand-lime px-6 py-3 text-sm font-semibold text-brand-dark transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Get Your NFC Card"}
        </button>
      </form>
    </GlassPanel>
  );
}
