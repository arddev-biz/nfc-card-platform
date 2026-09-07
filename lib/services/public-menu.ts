import "server-only";
import { db } from "@/lib/db";

/**
 * NOTE on the `status: "ACTIVE"` filter below: this must stay consistent
 * with the same rule enforced in lib/services/public-profile.ts (a
 * SUSPENDED/ARCHIVED business is never publicly visible, menu included).
 * It's duplicated here — rather than calling getPublicBusinessProfile()
 * — only because this query also needs menu/category/item data in the
 * same round trip; the invariant itself ("ACTIVE" only) is a single
 * field and not meaningfully at risk of drifting.
 */

/**
 * Slug-based convenience wrapper around isMenuAvailableForOrganization,
 * for the public profile page (which only has the slug, and
 * deliberately never selects Organization.id in its own query — see
 * lib/services/public-profile.ts) to decide whether to show a "View
 * Menu" link, without fetching the full menu contents just to check.
 */
export async function isMenuAvailableForSlug(slug: string): Promise<boolean> {
  const organization = await db.organization.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true },
  });
  if (!organization) return false;
  return isMenuAvailableForOrganization(organization.id);
}

export async function isMenuAvailableForOrganization(organizationId: string): Promise<boolean> {
  const businessModule = await db.businessModule.findUnique({
    where: { organizationId_type: { organizationId, type: "MENU" } },
    select: { isEnabled: true },
  });
  if (!businessModule?.isEnabled) return false;

  const menu = await db.menu.findUnique({
    where: { organizationId },
    select: {
      isActive: true,
      categories: {
        where: { isActive: true },
        select: {
          items: { where: { isActive: true }, select: { id: true }, take: 1 },
        },
      },
    },
  });

  if (!menu || !menu.isActive) return false;
  return menu.categories.some((category) => category.items.length > 0);
}

export async function getPublicMenu(slug: string) {
  const organization = await db.organization.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      name: true,
      profile: {
        select: {
          displayName: true,
          themeColor: true,
          logoUrl: true,
          coverImageUrl: true,
          backgroundType: true,
          backgroundColor: true,
          backgroundGradient: true,
          backgroundImageUrl: true,
          backgroundMode: true,
        },
      },
      modules: {
        where: { type: "MENU" },
        select: { isEnabled: true },
      },
      menu: {
        select: {
          name: true,
          description: true,
          isActive: true,
          categories: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              items: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  name: true,
                  description: true,
                  priceMinor: true,
                  currency: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!organization || !organization.profile) return null;

  const moduleEnabled = organization.modules[0]?.isEnabled ?? false;
  if (!moduleEnabled) return null;

  if (!organization.menu || !organization.menu.isActive) return null;

  const categoriesWithItems = organization.menu.categories.filter(
    (category) => category.items.length > 0
  );
  if (categoriesWithItems.length === 0) return null;

  return {
    businessName: organization.profile.displayName || organization.name,
    themeColor: organization.profile.themeColor,
    logoUrl: organization.profile.logoUrl,
    coverImageUrl: organization.profile.coverImageUrl,
    background: {
      backgroundType: organization.profile.backgroundType,
      backgroundColor: organization.profile.backgroundColor,
      backgroundGradient: organization.profile.backgroundGradient,
      backgroundImageUrl: organization.profile.backgroundImageUrl,
      backgroundMode: organization.profile.backgroundMode,
    },
    menuName: organization.menu.name,
    menuDescription: organization.menu.description,
    categories: categoriesWithItems,
  };
}

export type PublicMenu = NonNullable<Awaited<ReturnType<typeof getPublicMenu>>>;
