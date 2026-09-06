import "server-only";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/currency";
import type { CategoryInput, ItemInput, MenuDetailsInput } from "@/lib/validation/menus";

export class OrganizationNotFoundError extends Error {
  constructor() {
    super("Business not found.");
    this.name = "OrganizationNotFoundError";
  }
}

export class MenuNotFoundError extends Error {
  constructor() {
    super("Menu not found.");
    this.name = "MenuNotFoundError";
  }
}

export class CategoryNotFoundError extends Error {
  constructor() {
    super("Category not found.");
    this.name = "CategoryNotFoundError";
  }
}

export class ItemNotFoundError extends Error {
  constructor() {
    super("Menu item not found.");
    this.name = "ItemNotFoundError";
  }
}

async function organizationExists(organizationId: string): Promise<boolean> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  return Boolean(org);
}

/** Fetches the organization's menu, throwing if the organization or its menu doesn't exist — the ownership anchor for every category/item operation below. */
async function getOwnedMenu(organizationId: string) {
  if (!(await organizationExists(organizationId))) {
    throw new OrganizationNotFoundError();
  }
  const menu = await db.menu.findUnique({ where: { organizationId } });
  if (!menu) {
    throw new MenuNotFoundError();
  }
  return menu;
}

/** Fetches a category only if it belongs to this organization's menu — the ownership guard against IDOR. */
async function findOwnedCategory(organizationId: string, categoryId: string) {
  const menu = await getOwnedMenu(organizationId);
  const category = await db.menuCategory.findFirst({
    where: { id: categoryId, menuId: menu.id },
  });
  if (!category) {
    throw new CategoryNotFoundError();
  }
  return category;
}

/** Fetches an item only if it belongs to a category within this organization's menu. */
async function findOwnedItem(organizationId: string, itemId: string) {
  const menu = await getOwnedMenu(organizationId);
  const item = await db.menuItem.findFirst({
    where: { id: itemId, category: { menuId: menu.id } },
  });
  if (!item) {
    throw new ItemNotFoundError();
  }
  return item;
}

// ── Module enablement ──────────────────────────────────────────────

export async function isMenuModuleEnabled(organizationId: string): Promise<boolean> {
  const businessModule = await db.businessModule.findUnique({
    where: { organizationId_type: { organizationId, type: "MENU" } },
    select: { isEnabled: true },
  });
  return businessModule?.isEnabled ?? false;
}

/**
 * Enables/disables the Menu module. Enabling for the first time also
 * creates an (initially empty) Menu row — V1 is one primary menu per
 * organization, so this keeps the admin flow to a single toggle instead
 * of a separate "create menu" step. Disabling never deletes menu data,
 * so re-enabling picks up exactly where the business left off.
 */
export async function setMenuModuleEnabled(organizationId: string, isEnabled: boolean) {
  if (!(await organizationExists(organizationId))) {
    throw new OrganizationNotFoundError();
  }

  const businessModule = await db.businessModule.upsert({
    where: { organizationId_type: { organizationId, type: "MENU" } },
    update: { isEnabled },
    create: { organizationId, type: "MENU", isEnabled },
  });

  if (isEnabled) {
    await db.menu.upsert({
      where: { organizationId },
      update: {},
      create: { organizationId },
    });
  }

  return businessModule;
}

// ── Menu (admin view) ──────────────────────────────────────────────

export async function getMenuForOrganization(organizationId: string) {
  if (!(await organizationExists(organizationId))) {
    throw new OrganizationNotFoundError();
  }

  const [isEnabled, menu] = await Promise.all([
    isMenuModuleEnabled(organizationId),
    db.menu.findUnique({
      where: { organizationId },
      include: {
        categories: {
          orderBy: { sortOrder: "asc" },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
      },
    }),
  ]);

  return { isEnabled, menu };
}

export async function updateMenuDetails(organizationId: string, input: MenuDetailsInput) {
  const menu = await getOwnedMenu(organizationId);

  return db.menu.update({
    where: { id: menu.id },
    data: {
      name: input.name,
      description: input.description,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    },
  });
}

// ── Categories ──────────────────────────────────────────────────────

export async function createCategory(organizationId: string, input: CategoryInput) {
  const menu = await getOwnedMenu(organizationId);

  const maxOrder = await db.menuCategory.aggregate({
    where: { menuId: menu.id },
    _max: { sortOrder: true },
  });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  return db.menuCategory.create({
    data: {
      menuId: menu.id,
      name: input.name,
      description: input.description,
      sortOrder: nextOrder,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateCategory(
  organizationId: string,
  categoryId: string,
  input: CategoryInput
) {
  const existing = await findOwnedCategory(organizationId, categoryId);

  return db.menuCategory.update({
    where: { id: existing.id },
    data: {
      name: input.name,
      description: input.description,
      isActive: input.isActive ?? existing.isActive,
    },
  });
}

export async function setCategoryActive(
  organizationId: string,
  categoryId: string,
  isActive: boolean
) {
  const existing = await findOwnedCategory(organizationId, categoryId);
  return db.menuCategory.update({ where: { id: existing.id }, data: { isActive } });
}

/** A normal delete — categories don't need Organization's archive/soft-delete behavior. Cascades to its items at the database level (see schema). */
export async function deleteCategory(organizationId: string, categoryId: string) {
  const existing = await findOwnedCategory(organizationId, categoryId);
  await db.menuCategory.delete({ where: { id: existing.id } });
}

/** Returns false (rather than throwing) if orderedIds isn't an exact permutation of the category's current items — the route maps that to a 400. */
export async function reorderCategories(
  organizationId: string,
  orderedIds: string[]
): Promise<boolean> {
  const menu = await getOwnedMenu(organizationId);

  const existing = await db.menuCategory.findMany({
    where: { menuId: menu.id },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((c) => c.id));

  const isValidPermutation =
    orderedIds.length === existingIds.size &&
    new Set(orderedIds).size === orderedIds.length &&
    orderedIds.every((id) => existingIds.has(id));

  if (!isValidPermutation) return false;

  await db.$transaction(
    orderedIds.map((id, index) => db.menuCategory.update({ where: { id }, data: { sortOrder: index } }))
  );
  return true;
}

// ── Items ───────────────────────────────────────────────────────────

export async function createItem(organizationId: string, categoryId: string, input: ItemInput) {
  const category = await findOwnedCategory(organizationId, categoryId);

  const maxOrder = await db.menuItem.aggregate({
    where: { categoryId: category.id },
    _max: { sortOrder: true },
  });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  return db.menuItem.create({
    data: {
      categoryId: category.id,
      name: input.name,
      description: input.description,
      priceMinor: toMinorUnits(input.price, input.currency),
      currency: input.currency,
      sortOrder: nextOrder,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateItem(organizationId: string, itemId: string, input: ItemInput) {
  const existing = await findOwnedItem(organizationId, itemId);

  return db.menuItem.update({
    where: { id: existing.id },
    data: {
      name: input.name,
      description: input.description,
      priceMinor: toMinorUnits(input.price, input.currency),
      currency: input.currency,
      isActive: input.isActive ?? existing.isActive,
    },
  });
}

export async function setItemActive(organizationId: string, itemId: string, isActive: boolean) {
  const existing = await findOwnedItem(organizationId, itemId);
  return db.menuItem.update({ where: { id: existing.id }, data: { isActive } });
}

export async function deleteItem(organizationId: string, itemId: string) {
  const existing = await findOwnedItem(organizationId, itemId);
  await db.menuItem.delete({ where: { id: existing.id } });
}

/** Reorders items within a single category. `orderedIds` must be an exact permutation of that category's current items. */
export async function reorderItems(
  organizationId: string,
  categoryId: string,
  orderedIds: string[]
): Promise<boolean> {
  const category = await findOwnedCategory(organizationId, categoryId);

  const existing = await db.menuItem.findMany({
    where: { categoryId: category.id },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((i) => i.id));

  const isValidPermutation =
    orderedIds.length === existingIds.size &&
    new Set(orderedIds).size === orderedIds.length &&
    orderedIds.every((id) => existingIds.has(id));

  if (!isValidPermutation) return false;

  await db.$transaction(
    orderedIds.map((id, index) => db.menuItem.update({ where: { id }, data: { sortOrder: index } }))
  );
  return true;
}
