"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Menu, MenuCategory, MenuItem } from "@prisma/client";
import { formatPrice, fromMinorUnits } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { MenuCategoryForm } from "@/components/admin/MenuCategoryForm";
import { MenuItemForm } from "@/components/admin/MenuItemForm";

interface MenuWithContent extends Menu {
  categories: (MenuCategory & { items: MenuItem[] })[];
}

interface MenuManagerProps {
  organizationId: string;
  isEnabled: boolean;
  menu: MenuWithContent | null;
}

export function MenuManager({ organizationId, isEnabled, menu }: MenuManagerProps) {
  const router = useRouter();
  const [isTogglingModule, setIsTogglingModule] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Menu details (name/description) editing
  const [detailsName, setDetailsName] = useState(menu?.name ?? "Menu");
  const [detailsDescription, setDetailsDescription] = useState(menu?.description ?? "");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Category state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null);

  // Item state (item ids are unique across categories, so a single set of ids is enough)
  const [addingItemForCategoryId, setAddingItemForCategoryId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  async function handleToggleModule() {
    if (isEnabled && !window.confirm("Disable the Menu module? It will be hidden from customers, but nothing is deleted.")) {
      return;
    }

    setIsTogglingModule(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/menu/module`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !isEnabled }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong updating the Menu module.");
        return;
      }
      router.refresh();
    } finally {
      setIsTogglingModule(false);
    }
  }

  async function handleSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingDetails(true);
    setDetailsSaved(false);
    setError(null);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: detailsName, description: detailsDescription, isActive: true }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong saving the menu details.");
        return;
      }
      setDetailsSaved(true);
      router.refresh();
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function handleDeleteCategory(category: MenuCategory) {
    if (!window.confirm(`Delete "${category.name}" and all its items? This cannot be undone.`)) return;

    setBusyCategoryId(category.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/menu/categories/${category.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong deleting the category.");
        return;
      }
      router.refresh();
    } finally {
      setBusyCategoryId(null);
    }
  }

  async function handleToggleCategoryActive(category: MenuCategory) {
    setBusyCategoryId(category.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/menu/categories/${category.id}/active`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !category.isActive }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong updating the category.");
        return;
      }
      router.refresh();
    } finally {
      setBusyCategoryId(null);
    }
  }

  async function handleMoveCategory(categories: MenuCategory[], index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = [...categories];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const orderedIds = reordered.map((c) => c.id);

    setBusyCategoryId(categories[index].id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/menu/categories/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong reordering categories.");
        return;
      }
      router.refresh();
    } finally {
      setBusyCategoryId(null);
    }
  }

  async function handleDeleteItem(item: MenuItem) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    setBusyItemId(item.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/menu/items/${item.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong deleting the item.");
        return;
      }
      router.refresh();
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleToggleItemActive(item: MenuItem) {
    setBusyItemId(item.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/menu/items/${item.id}/active`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !item.isActive }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong updating the item.");
        return;
      }
      router.refresh();
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleMoveItem(categoryId: string, items: MenuItem[], index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const orderedIds = reordered.map((i) => i.id);

    setBusyItemId(items[index].id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/menu/categories/${categoryId}/items/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong reordering items.");
        return;
      }
      router.refresh();
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
            Menu Module
          </h2>
          <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
            {isEnabled
              ? "Customers can see the menu from the public profile."
              : "Enable this to let customers view a digital menu from the public profile."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={isEnabled ? "green" : "gray"}>{isEnabled ? "Enabled" : "Disabled"}</Badge>
          <Button
            type="button"
            variant="secondary"
            disabled={isTogglingModule}
            onClick={handleToggleModule}
          >
            {isTogglingModule ? "Saving…" : isEnabled ? "Disable Menu" : "Enable Menu"}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!isEnabled ? null : (
        <div className="mt-6 space-y-6">
          <form onSubmit={handleSaveDetails} className="space-y-3 rounded-lg border border-[var(--admin-border)] p-4">
            <div>
              <label htmlFor="menu-name" className="block text-sm font-medium text-[var(--admin-text)]">
                Menu name
              </label>
              <Input
                id="menu-name"
                value={detailsName}
                onChange={(e) => {
                  setDetailsName(e.target.value);
                  setDetailsSaved(false);
                }}
              />
            </div>
            <div>
              <label htmlFor="menu-description" className="block text-sm font-medium text-[var(--admin-text)]">
                Description (optional)
              </label>
              <Textarea
                id="menu-description"
                rows={2}
                value={detailsDescription}
                onChange={(e) => {
                  setDetailsDescription(e.target.value);
                  setDetailsSaved(false);
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="secondary" disabled={isSavingDetails}>
                {isSavingDetails ? "Saving…" : "Save menu details"}
              </Button>
              {detailsSaved && <span className="text-sm text-green-700">Saved.</span>}
            </div>
          </form>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--admin-text)]">Categories</h3>
              {!isAddingCategory && (
                <Button type="button" variant="secondary" onClick={() => setIsAddingCategory(true)}>
                  Add category
                </Button>
              )}
            </div>

            {isAddingCategory && (
              <div className="mt-3">
                <MenuCategoryForm
                  organizationId={organizationId}
                  mode="create"
                  onCancel={() => setIsAddingCategory(false)}
                  onSaved={() => {
                    setIsAddingCategory(false);
                    router.refresh();
                  }}
                />
              </div>
            )}

            {(menu?.categories.length ?? 0) === 0 && !isAddingCategory ? (
              <p className="mt-4 text-sm text-[var(--admin-text-secondary)]">
                No categories yet. Add one (e.g. &ldquo;Coffee&rdquo; or &ldquo;Main Courses&rdquo;) to
                start building the menu.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {menu?.categories.map((category, categoryIndex) => (
                  <li key={category.id} className="rounded-xl border border-[var(--admin-border)] p-4">
                    {editingCategoryId === category.id ? (
                      <MenuCategoryForm
                        organizationId={organizationId}
                        mode="edit"
                        categoryId={category.id}
                        initialValues={{
                          name: category.name,
                          description: category.description ?? "",
                          isActive: category.isActive,
                        }}
                        onCancel={() => setEditingCategoryId(null)}
                        onSaved={() => {
                          setEditingCategoryId(null);
                          router.refresh();
                        }}
                      />
                    ) : (
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--admin-text)]">{category.name}</span>
                            <Badge tone={category.isActive ? "green" : "gray"}>
                              {category.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          {category.description && (
                            <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">{category.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            aria-label="Move category up"
                            disabled={categoryIndex === 0 || busyCategoryId === category.id}
                            onClick={() => handleMoveCategory(menu.categories, categoryIndex, -1)}
                            className="rounded border border-[var(--admin-border)] px-2 py-1 text-xs text-[var(--admin-text-secondary)] disabled:opacity-40"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label="Move category down"
                            disabled={
                              categoryIndex === menu.categories.length - 1 ||
                              busyCategoryId === category.id
                            }
                            onClick={() => handleMoveCategory(menu.categories, categoryIndex, 1)}
                            className="rounded border border-[var(--admin-border)] px-2 py-1 text-xs text-[var(--admin-text-secondary)] disabled:opacity-40"
                          >
                            ↓
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={busyCategoryId === category.id}
                            onClick={() => handleToggleCategoryActive(category)}
                          >
                            {category.isActive ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={busyCategoryId === category.id}
                            onClick={() => setEditingCategoryId(category.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={busyCategoryId === category.id}
                            onClick={() => handleDeleteCategory(category)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Items within this category */}
                    <div className="mt-4 border-t border-[var(--admin-border)] pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
                          Items
                        </h4>
                        {addingItemForCategoryId !== category.id && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setAddingItemForCategoryId(category.id)}
                          >
                            Add item
                          </Button>
                        )}
                      </div>

                      {addingItemForCategoryId === category.id && (
                        <div className="mt-3">
                          <MenuItemForm
                            organizationId={organizationId}
                            mode="create"
                            categoryId={category.id}
                            onCancel={() => setAddingItemForCategoryId(null)}
                            onSaved={() => {
                              setAddingItemForCategoryId(null);
                              router.refresh();
                            }}
                          />
                        </div>
                      )}

                      {category.items.length === 0 && addingItemForCategoryId !== category.id ? (
                        <p className="mt-2 text-sm text-[var(--admin-text-secondary)]">No items in this category yet.</p>
                      ) : (
                        <ul className="mt-3 divide-y divide-[var(--admin-border)]">
                          {category.items.map((item, itemIndex) =>
                            editingItemId === item.id ? (
                              <li key={item.id} className="py-3">
                                <MenuItemForm
                                  organizationId={organizationId}
                                  mode="edit"
                                  categoryId={category.id}
                                  itemId={item.id}
                                  initialValues={{
                                    name: item.name,
                                    description: item.description ?? "",
                                    price: String(fromMinorUnits(item.priceMinor, item.currency)),
                                    currency: item.currency,
                                    isActive: item.isActive,
                                  }}
                                  onCancel={() => setEditingItemId(null)}
                                  onSaved={() => {
                                    setEditingItemId(null);
                                    router.refresh();
                                  }}
                                />
                              </li>
                            ) : (
                              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-[var(--admin-text)]">
                                      {item.name}
                                    </span>
                                    <Badge tone={item.isActive ? "green" : "gray"}>
                                      {item.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-[var(--admin-text-secondary)]">{item.description}</p>
                                  )}
                                  <p className="text-sm font-medium text-[var(--admin-text)]">
                                    {formatPrice(item.priceMinor, item.currency)}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    aria-label="Move item up"
                                    disabled={itemIndex === 0 || busyItemId === item.id}
                                    onClick={() => handleMoveItem(category.id, category.items, itemIndex, -1)}
                                    className="rounded border border-[var(--admin-border)] px-2 py-1 text-xs text-[var(--admin-text-secondary)] disabled:opacity-40"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Move item down"
                                    disabled={
                                      itemIndex === category.items.length - 1 || busyItemId === item.id
                                    }
                                    onClick={() => handleMoveItem(category.id, category.items, itemIndex, 1)}
                                    className="rounded border border-[var(--admin-border)] px-2 py-1 text-xs text-[var(--admin-text-secondary)] disabled:opacity-40"
                                  >
                                    ↓
                                  </button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={busyItemId === item.id}
                                    onClick={() => handleToggleItemActive(item)}
                                  >
                                    {item.isActive ? "Disable" : "Enable"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={busyItemId === item.id}
                                    onClick={() => setEditingItemId(item.id)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={busyItemId === item.id}
                                    onClick={() => handleDeleteItem(item)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
