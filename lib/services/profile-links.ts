import "server-only";
import type { LinkType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getDefaultLabel } from "@/lib/linkTypes";
import type { ProfileLinkInput } from "@/lib/validation/profile-links";

export class OrganizationNotFoundError extends Error {
  constructor() {
    super("Business not found.");
    this.name = "OrganizationNotFoundError";
  }
}

export class ProfileLinkNotFoundError extends Error {
  constructor() {
    super("Link not found.");
    this.name = "ProfileLinkNotFoundError";
  }
}

export class ProfileLinkConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileLinkConflictError";
  }
}

const SINGLETON_LINK_TYPES = new Set<LinkType>([
  "PHONE",
  "WHATSAPP",
  "GOOGLE_MAPS",
  "GOOGLE_REVIEWS",
]);

async function lockBusinessProfile(
  tx: Prisma.TransactionClient,
  organizationId: string
): Promise<string> {
  const profile = await tx.businessProfile.findUnique({
    where: { organizationId },
    select: { id: true },
  });
  if (!profile) throw new OrganizationNotFoundError();

  await tx.$queryRaw`SELECT "id" FROM "BusinessProfile" WHERE "id" = ${profile.id} FOR UPDATE`;
  return profile.id;
}

/** Resolves an Organization's BusinessProfile id, or null if the organization doesn't exist. */
async function getBusinessProfileId(organizationId: string): Promise<string | null> {
  const profile = await db.businessProfile.findUnique({
    where: { organizationId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

/**
 * Loads a link by id, scoped to a specific organization's profile in a
 * single query (`id` AND `businessProfileId` in the same `where`).
 * This is the key guard against IDOR: a link belonging to Organization
 * A can never be found — let alone updated or deleted — through
 * Organization B's id, because the query simply won't match it.
 */
async function findOwnedLink(organizationId: string, linkId: string) {
  const profileId = await getBusinessProfileId(organizationId);
  if (!profileId) throw new OrganizationNotFoundError();

  const link = await db.profileLink.findFirst({
    where: { id: linkId, businessProfileId: profileId },
  });
  if (!link) throw new ProfileLinkNotFoundError();
  return link;
}

export async function listProfileLinks(organizationId: string) {
  const profileId = await getBusinessProfileId(organizationId);
  if (!profileId) throw new OrganizationNotFoundError();

  return db.profileLink.findMany({
    where: { businessProfileId: profileId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getProfileLink(organizationId: string, linkId: string) {
  return findOwnedLink(organizationId, linkId);
}

export async function createProfileLink(organizationId: string, input: ProfileLinkInput) {
  return db.$transaction(async (tx) => {
    const profileId = await lockBusinessProfile(tx, organizationId);

    if (SINGLETON_LINK_TYPES.has(input.type)) {
      const duplicate = await tx.profileLink.findFirst({
        where: { businessProfileId: profileId, type: input.type },
        select: { id: true },
      });
      if (duplicate) {
        throw new ProfileLinkConflictError(`This profile already has a ${input.type} link.`);
      }
    }

    const highest = await tx.profileLink.aggregate({
      where: { businessProfileId: profileId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (highest._max.sortOrder ?? -1) + 1;
    const label = input.label?.trim() || getDefaultLabel(input.type);

    return tx.profileLink.create({
      data: {
        businessProfileId: profileId,
        type: input.type,
        label,
        url: input.value,
        isActive: input.isActive ?? true,
        sortOrder: nextSortOrder,
      },
    });
  });
}

export async function updateProfileLink(
  organizationId: string,
  linkId: string,
  input: ProfileLinkInput
) {
  return db.$transaction(async (tx) => {
    const profileId = await lockBusinessProfile(tx, organizationId);
    const existing = await tx.profileLink.findFirst({
      where: { id: linkId, businessProfileId: profileId },
    });
    if (!existing) throw new ProfileLinkNotFoundError();

    if (existing.type !== input.type && SINGLETON_LINK_TYPES.has(input.type)) {
      const duplicate = await tx.profileLink.findFirst({
        where: { businessProfileId: profileId, type: input.type, id: { not: existing.id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ProfileLinkConflictError(`This profile already has a ${input.type} link.`);
      }
    }

    if (
      existing.type === input.type &&
      !existing.isActive &&
      input.isActive === true &&
      SINGLETON_LINK_TYPES.has(input.type)
    ) {
      const activeDuplicate = await tx.profileLink.findFirst({
        where: {
          businessProfileId: profileId,
          type: input.type,
          isActive: true,
          id: { not: existing.id },
        },
        select: { id: true },
      });
      if (activeDuplicate) {
        throw new ProfileLinkConflictError(`Another ${input.type} link is already active.`);
      }
    }

    const label = input.label?.trim() || getDefaultLabel(input.type);
    return tx.profileLink.update({
      where: { id: existing.id },
      data: {
        type: input.type,
        label,
        url: input.value,
        isActive: input.isActive ?? existing.isActive,
      },
    });
  });
}

export async function deleteProfileLink(organizationId: string, linkId: string) {
  const existing = await findOwnedLink(organizationId, linkId);
  await db.profileLink.delete({ where: { id: existing.id } });
}

/** Toggles just the active state, mirroring the organizations service's setOrganizationStatus pattern. */
export async function setProfileLinkActive(
  organizationId: string,
  linkId: string,
  isActive: boolean
) {
  return db.$transaction(async (tx) => {
    const profileId = await lockBusinessProfile(tx, organizationId);
    const existing = await tx.profileLink.findFirst({
      where: { id: linkId, businessProfileId: profileId },
    });
    if (!existing) throw new ProfileLinkNotFoundError();

    if (isActive && SINGLETON_LINK_TYPES.has(existing.type)) {
      const activeDuplicate = await tx.profileLink.findFirst({
        where: {
          businessProfileId: profileId,
          type: existing.type,
          isActive: true,
          id: { not: existing.id },
        },
        select: { id: true },
      });
      if (activeDuplicate) {
        throw new ProfileLinkConflictError(`Another ${existing.type} link is already active.`);
      }
    }

    return tx.profileLink.update({
      where: { id: existing.id },
      data: { isActive },
    });
  });
}

/**
 * Persists either the full link order or the exact active-link subset
 * used by Profile Builder. Inactive links keep their relative slots,
 * and every row is renumbered so sort positions remain unique.
 */
export async function reorderProfileLinks(organizationId: string, orderedIds: string[]) {
  return db.$transaction(async (tx) => {
    const profileId = await lockBusinessProfile(tx, organizationId);
    const existingLinks = await tx.profileLink.findMany({
      where: { businessProfileId: profileId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, isActive: true },
    });
    const allIds = existingLinks.map((link) => link.id);
    const activeIds = existingLinks.filter((link) => link.isActive).map((link) => link.id);
    const submittedIds = new Set(orderedIds);
    const isExactSet = (ids: string[]) =>
      orderedIds.length === ids.length &&
      submittedIds.size === orderedIds.length &&
      ids.every((id) => submittedIds.has(id));

    let completeOrder: string[];
    if (isExactSet(allIds)) {
      completeOrder = orderedIds;
    } else if (isExactSet(activeIds)) {
      let activeIndex = 0;
      completeOrder = existingLinks.map((link) =>
        link.isActive ? orderedIds[activeIndex++] : link.id
      );
    } else {
      throw new ProfileLinkNotFoundError();
    }

    await Promise.all(
      completeOrder.map((id, index) =>
        tx.profileLink.update({ where: { id }, data: { sortOrder: index } })
      )
    );

    return tx.profileLink.findMany({
      where: { businessProfileId: profileId },
      orderBy: { sortOrder: "asc" },
    });
  });
}
