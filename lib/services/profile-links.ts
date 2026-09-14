import "server-only";
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
  const profileId = await getBusinessProfileId(organizationId);
  if (!profileId) throw new OrganizationNotFoundError();

  const highest = await db.profileLink.aggregate({
    where: { businessProfileId: profileId },
    _max: { sortOrder: true },
  });
  const nextSortOrder = (highest._max.sortOrder ?? -1) + 1;

  const label = input.label?.trim() || getDefaultLabel(input.type);

  return db.profileLink.create({
    data: {
      businessProfileId: profileId,
      type: input.type,
      label,
      url: input.value,
      isActive: input.isActive ?? true,
      sortOrder: nextSortOrder,
    },
  });
}

export async function updateProfileLink(
  organizationId: string,
  linkId: string,
  input: ProfileLinkInput
) {
  const existing = await findOwnedLink(organizationId, linkId);
  const label = input.label?.trim() || getDefaultLabel(input.type);

  return db.profileLink.update({
    where: { id: existing.id },
    data: {
      type: input.type,
      label,
      url: input.value,
      isActive: input.isActive ?? existing.isActive,
    },
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
  const existing = await findOwnedLink(organizationId, linkId);
  return db.profileLink.update({
    where: { id: existing.id },
    data: { isActive },
  });
}

/**
 * Persists a new display order for a business's links. `orderedIds`
 * must contain exactly the same set of link ids the organization
 * already owns — anything else (a foreign id, a missing id) is
 * rejected rather than silently partially applied.
 */
export async function reorderProfileLinks(organizationId: string, orderedIds: string[]) {
  const profileId = await getBusinessProfileId(organizationId);
  if (!profileId) throw new OrganizationNotFoundError();

  const existingLinks = await db.profileLink.findMany({
    where: { businessProfileId: profileId },
    select: { id: true },
  });
  const ownedIds = new Set(existingLinks.map((link) => link.id));

  // orderedIds may be the full set (the original Profile Links manager)
  // or a subset (the Profile Builder's Links editor only shows
  // "secondary" links — WhatsApp/Phone/Maps/Reviews are consumed into
  // primary actions and rendered by type, never by sortOrder among the
  // secondary list, so reassigning sortOrder only within a subset can
  // never visually collide with those). Every id must belong to this
  // profile and appear at most once.
  const isValidReorder =
    orderedIds.length > 0 &&
    new Set(orderedIds).size === orderedIds.length &&
    orderedIds.every((id) => ownedIds.has(id));

  if (!isValidReorder) {
    throw new ProfileLinkNotFoundError();
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.profileLink.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  return db.profileLink.findMany({
    where: { businessProfileId: profileId },
    orderBy: { sortOrder: "asc" },
  });
}
