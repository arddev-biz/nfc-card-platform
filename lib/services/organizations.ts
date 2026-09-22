import "server-only";
import { initialV2Sections } from "@/lib/services/profile-v2";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import type { BusinessInput, BusinessUpdateInput } from "@/lib/validation/business";
import type { ProfileContentUpdateInput } from "@/lib/validation/profile-content";
import type { OrgStatus } from "@prisma/client";

export class SlugTakenError extends Error {
  constructor(public slug: string) {
    super(`The slug "${slug}" is already in use.`);
    this.name = "SlugTakenError";
  }
}

/** True if a Prisma unique-constraint violation (P2002) was on the `slug` field. */
export function isSlugUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta?.target as string[]).includes("slug")
  );
}

/**
 * Slugs that must never be assignable to a business, because they would
 * collide with the app's own top-level routes once the public
 * /[businessSlug] page exists (Phase 4). Next.js would always resolve
 * these to the static route, not a business profile, so rejecting them
 * up front avoids a business silently becoming unreachable.
 */
const RESERVED_SLUGS = new Set(["admin", "api", "login", "logout", "c", "get-started"]);

type OrganizationReader = Pick<Prisma.TransactionClient, "organization">;

/** Returns true if the given slug is already used by a different organization, or is reserved. */
async function slugExists(
  client: OrganizationReader,
  slug: string,
  excludeOrganizationId?: string
): Promise<boolean> {
  if (RESERVED_SLUGS.has(slug)) return true;
  const existing = await client.organization.findUnique({ where: { slug } });
  if (!existing) return false;
  if (excludeOrganizationId && existing.id === excludeOrganizationId) return false;
  return true;
}

/**
 * Generates a unique slug from `base`, appending `-2`, `-3`, etc. as
 * needed. Used only when the admin leaves the slug field blank — an
 * explicitly-typed, already-taken slug is rejected instead (see
 * SlugTakenError), rather than silently changed.
 */
export async function generateUniqueSlug(
  base: string,
  excludeOrganizationId?: string,
  client: OrganizationReader = db
): Promise<string> {
  const normalizedBase = slugify(base) || "business";
  let candidate = normalizedBase;
  let suffix = 2;

  // Bounded loop: guards against a pathological run of collisions rather
  // than looping forever. 1000 attempts is far more than any real V1
  // usage pattern would ever hit.
  for (let attempts = 0; attempts < 1000; attempts += 1) {
    if (!(await slugExists(client, candidate, excludeOrganizationId))) {
      return candidate;
    }
    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }

  throw new Error("Could not generate a unique slug after many attempts.");
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  businessType: string | null;
  status: OrgStatus;
  createdAt: Date;
  subscription: {
    status: string;
    endDate: Date;
  } | null;
}

export async function listOrganizations(): Promise<OrganizationListItem[]> {
  const organizations = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    businessType: org.businessType,
    status: org.status,
    createdAt: org.createdAt,
    subscription: org.subscriptions[0]
      ? {
          status: org.subscriptions[0].status,
          endDate: org.subscriptions[0].endDate,
        }
      : null,
  }));
}

export async function getOrganizationById(id: string) {
  return db.organization.findUnique({
    where: { id },
    include: {
      profile: true,
      subscriptions: { orderBy: { createdAt: "desc" } },
    },
  });
}

/**
 * Creates an Organization, its BusinessProfile, and its first
 * Subscription atomically — if any step fails, nothing is persisted.
 * The organization is created with no owner user (ownerUserId stays
 * null), matching the approved V1 architecture: businesses are
 * manually managed by the SUPER_ADMIN, not self-service accounts.
 */
export async function createOrganizationInTransaction(
  tx: Prisma.TransactionClient,
  input: BusinessInput
) {
  let slug: string;

  if (input.slug) {
    if (await slugExists(tx, input.slug)) {
      throw new SlugTakenError(input.slug);
    }
    slug = input.slug;
  } else {
    slug = await generateUniqueSlug(input.businessName, undefined, tx);
  }

  const startDate = new Date();
  const endDate = addMonths(startDate, 12);

  try {
    const organization = await tx.organization.create({
      data: {
        name: input.businessName,
        slug,
        businessType: input.businessType,
        status: "ACTIVE",
      },
    });

    const profile = await tx.businessProfile.create({
      data: {
        organizationId: organization.id,
        builderVersion: 2,
        sections: { create: initialV2Sections() },
        links: { create: [
          ...(input.whatsapp ? [{ type: "WHATSAPP" as const, label: "WhatsApp", url: input.whatsapp, sortOrder: 0 }] : []),
          ...(input.website ? [{ type: "WEBSITE" as const, label: "Website", url: input.website, sortOrder: 1 }] : []),
        ] },
        displayName: input.displayName || input.businessName,
        bio: input.bio,
        phone: input.phone,
        whatsapp: null,
        email: input.email,
        website: null,
        address: input.address,
        googleMapsUrl: input.googleMapsUrl,
        themeColor: input.themeColor,
        backgroundType: input.backgroundType,
        backgroundColor: input.backgroundColor,
        backgroundGradient: input.backgroundGradient,
        backgroundMode: input.backgroundMode,
      },
    });

    const subscription = await tx.subscription.create({
      data: {
        organizationId: organization.id,
        plan: "standard",
        status: "ACTIVE",
        startDate,
        endDate,
      },
    });

    return { organization, profile, subscription };
  } catch (error) {
    if (isSlugUniqueConstraintError(error)) {
      throw new SlugTakenError(slug);
    }
    throw error;
  }
}

export async function createOrganization(input: BusinessInput) {
  return db.$transaction((tx) => createOrganizationInTransaction(tx, input));
}

/**
 * Updates an existing Organization and its BusinessProfile. Does not
 * touch the Subscription — subscription tracking is display-only in
 * V1 (see the admin edit page for the read-only summary).
 */
export async function updateOrganization(id: string, input: BusinessUpdateInput) {
  const existing = await db.organization.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  let slug = existing.slug;

  if (input.slug && input.slug !== existing.slug) {
    if (await slugExists(db, input.slug, id)) {
      throw new SlugTakenError(input.slug);
    }
    slug = input.slug;
  }

  return db
    .$transaction(async (tx) => {
      const organization = await tx.organization.update({
        where: { id },
        data: {
          name: input.businessName,
          slug,
          businessType: input.businessType,
        },
      });

      const profile = await tx.businessProfile.update({
        where: { organizationId: id },
        data: {
          displayName: input.displayName,
          bio: input.bio,
          phone: input.phone,
          whatsapp: input.whatsapp,
          email: input.email,
          website: input.website,
          address: input.address,
          googleMapsUrl: input.googleMapsUrl,
          themeColor: input.themeColor,
          backgroundType: input.backgroundType,
          backgroundColor: input.backgroundColor,
          backgroundGradient: input.backgroundGradient,
          backgroundMode: input.backgroundMode,
        },
      });

      return { organization, profile };
    })
    .catch((error) => {
      if (isSlugUniqueConstraintError(error)) {
        throw new SlugTakenError(slug);
      }
      throw error;
    });
}

/**
 * Changes only the Organization's status (ACTIVE / SUSPENDED / ARCHIVED).
 * Organizations are never physically deleted through the admin
 * interface — archiving is the intended "removal" path. Returns null
 * if no organization with this id exists, matching the same
 * not-found pattern used by updateOrganization.
 */
export async function setOrganizationStatus(id: string, status: OrgStatus) {
  const existing = await db.organization.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  return db.organization.update({
    where: { id },
    data: { status },
  });
}

/**
 * Partial BusinessProfile update for the Profile Builder's direct
 * content/design editors (Header, Bio, Contact, Location, Design panel).
 * Unlike updateOrganization(), this accepts any subset of fields and
 * only writes the ones actually provided — the Builder saves one
 * block's settings at a time, not a whole form. Same canonical table,
 * same fields, just a narrower write path alongside the existing one.
 */
export async function updateProfileContentFields(
  organizationId: string,
  input: ProfileContentUpdateInput
) {
  const profile = await db.businessProfile.findUnique({ where: { organizationId } });
  if (!profile) return null;

  return db.businessProfile.update({
    where: { organizationId },
    data: input,
  });
}
