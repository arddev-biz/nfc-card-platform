"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export interface CategoryFormValues {
  name: string;
  description: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<"name" | "description", string[]>>;

interface MenuCategoryFormProps {
  organizationId: string;
  mode: "create" | "edit";
  categoryId?: string;
  initialValues?: Partial<CategoryFormValues>;
  onCancel: () => void;
  onSaved: () => void;
}

const emptyValues: CategoryFormValues = { name: "", description: "", isActive: true };

export function MenuCategoryForm({
  organizationId,
  mode,
  categoryId,
  initialValues,
  onCancel,
  onSaved,
}: MenuCategoryFormProps) {
  const [values, setValues] = useState<CategoryFormValues>({ ...emptyValues, ...initialValues });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const endpoint =
      mode === "create"
        ? `/api/admin/businesses/${organizationId}/menu/categories`
        : `/api/admin/businesses/${organizationId}/menu/categories/${categoryId}`;
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

      onSaved();
    } catch {
      setGeneralError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4"
    >
      {generalError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {generalError}
        </p>
      )}

      <div>
        <label htmlFor="category-name" className="block text-sm font-medium text-[var(--admin-text)]">
          Category name
        </label>
        <Input
          id="category-name"
          placeholder="e.g. Coffee, Main Courses, Desserts"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
        />
        {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="category-description" className="block text-sm font-medium text-[var(--admin-text)]">
          Description (optional)
        </label>
        <Textarea
          id="category-description"
          rows={2}
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
        />
        {fieldErrors.description && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.description[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : mode === "create" ? "Add category" : "Save category"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
