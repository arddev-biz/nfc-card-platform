"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { MENU_CURRENCIES, type MenuCurrencyCode } from "@/lib/currency";

export interface ItemFormValues {
  name: string;
  description: string;
  price: string; // kept as a string in form state; parsed to a number on submit
  currency: MenuCurrencyCode;
  isActive: boolean;
}

type FieldErrors = Partial<Record<"name" | "description" | "price" | "currency", string[]>>;

interface MenuItemFormProps {
  organizationId: string;
  mode: "create" | "edit";
  categoryId: string;
  itemId?: string;
  initialValues?: Partial<ItemFormValues>;
  onCancel: () => void;
  onSaved: () => void;
}

const emptyValues: ItemFormValues = {
  name: "",
  description: "",
  price: "",
  currency: "ALL",
  isActive: true,
};

export function MenuItemForm({
  organizationId,
  mode,
  categoryId,
  itemId,
  initialValues,
  onCancel,
  onSaved,
}: MenuItemFormProps) {
  const [values, setValues] = useState<ItemFormValues>({ ...emptyValues, ...initialValues });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const parsedPrice = Number(values.price);
    if (values.price.trim() === "" || Number.isNaN(parsedPrice)) {
      setFieldErrors({ price: ["Enter a valid price."] });
      return;
    }

    setIsSubmitting(true);

    const endpoint =
      mode === "create"
        ? `/api/admin/businesses/${organizationId}/menu/categories/${categoryId}/items`
        : `/api/admin/businesses/${organizationId}/menu/items/${itemId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          price: parsedPrice,
          currency: values.currency,
          isActive: values.isActive,
        }),
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
      className="space-y-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-4"
    >
      {generalError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {generalError}
        </p>
      )}

      <div>
        <label htmlFor="item-name" className="block text-sm font-medium text-[var(--admin-text)]">
          Item name
        </label>
        <Input
          id="item-name"
          placeholder="e.g. Cappuccino"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
        />
        {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="item-description" className="block text-sm font-medium text-[var(--admin-text)]">
          Description (optional)
        </label>
        <Textarea
          id="item-description"
          rows={2}
          placeholder="e.g. Espresso with steamed milk"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
        />
        {fieldErrors.description && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.description[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="item-price" className="block text-sm font-medium text-[var(--admin-text)]">
            Price
          </label>
          <Input
            id="item-price"
            inputMode="decimal"
            placeholder="e.g. 250"
            value={values.price}
            onChange={(e) => update("price", e.target.value)}
          />
          {fieldErrors.price && <p className="mt-1 text-sm text-red-600">{fieldErrors.price[0]}</p>}
        </div>

        <div>
          <label htmlFor="item-currency" className="block text-sm font-medium text-[var(--admin-text)]">
            Currency
          </label>
          <select
            id="item-currency"
            value={values.currency}
            onChange={(e) => update("currency", e.target.value as MenuCurrencyCode)}
            className="mt-1 block w-full rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm text-[var(--admin-text)] shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {MENU_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          {fieldErrors.currency && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.currency[0]}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : mode === "create" ? "Add item" : "Save item"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
