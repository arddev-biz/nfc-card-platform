import "server-only";
import {PLATFORM_NAME} from "@/lib/platform";
import { db } from "@/lib/db";
import { getV2Data } from "@/lib/services/profile-v2";
import { BLOCK_REGISTRY, SYSTEM_BLOCK_ORDER, type ResolvedBlock } from "@/lib/blocks/registry";
import type { Prisma, ProfileBlockKey } from "@prisma/client";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import {
  normalizeBackgroundGradient,
  normalizeBackgroundMode,
  normalizeBackgroundType,
} from "@/lib/background";

export type { ResolvedBlock };

export class OrganizationNotFoundError extends Error {
  constructor() {
    super("Business not found.");
    this.name = "OrganizationNotFoundError";
  }
}

export class BlockNotFoundError extends Error {
  constructor() {
    super("Block not found.");
    this.name = "BlockNotFoundError";
  }
}

export class BlockOperationNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockOperationNotAllowedError";
  }
}

async function getBusinessProfileId(organizationId: string): Promise<string> {
  const profile = await db.businessProfile.findUnique({
    where: { organizationId },
    select: { id: true },
  });
  if (!profile) throw new OrganizationNotFoundError();
  return profile.id;
}

/**
 * Admin equivalent of getPublicBusinessProfile — same select shape (so
 * the same buildProfileViewModel/ProfileRenderer work unchanged for
 * both), but with no `status: "ACTIVE"` filter, since the Profile
 * Builder must let an admin preview/edit a SUSPENDED or ARCHIVED
 * business's layout too. Deliberately duplicated rather than sharing a
 * query with the public service — admin and public contexts have
 * different trust assumptions and should not be coupled just to avoid
 * repeating a `select` block.
 */
export async function getBuilderProfileData(
  organizationId: string
): Promise<PublicBusinessProfile | null> {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: {
      name: true,
      businessType: true,
      profile: {
        select: {
          builderVersion: true,
          isVerified: true, verificationColor: true, verificationTooltip:true,
          displayName: true,
          bio: true,
          logoUrl: true,
          coverImageUrl: true,
          themeColor: true,
          backgroundType: true,
          backgroundColor: true,
          backgroundGradient: true,
          backgroundImageUrl: true,
          backgroundMode: true,
          phone: true,
          whatsapp: true,
          email: true,
          website: true,
          address: true,
          googleMapsUrl: true,
          links: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: { id: true, type: true, label: true, url: true },
          },
        },
      },
    },
  });

  if (!organization || !organization.profile) return null;

  const v2=organization.profile.builderVersion===2 ? await getV2Data(organizationId) : undefined;
  const branding=organization.profile.builderVersion===2 ? {platformName:PLATFORM_NAME} : undefined;

  return {
    ...organization,
    branding,
    v2: v2 ?? undefined,
    profile: {
      ...organization.profile,
      backgroundType: normalizeBackgroundType(organization.profile.backgroundType),
      backgroundGradient: normalizeBackgroundGradient(organization.profile.backgroundGradient),
      backgroundMode: normalizeBackgroundMode(organization.profile.backgroundMode),
    },
  };
}

/**
 * Every business gets exactly one row per system block key, created
 * lazily the first time the Builder is opened for that business — not
 * via migration/backfill. A business that never opens the Builder never
 * gets these rows and keeps rendering from the registry's defaults
 * (see the public page, which doesn't call this and instead treats a
 * missing row as "use the default" implicitly via getResolvedBlockLayout
 * below). This keeps every existing business backward-compatible by
 * construction.
 */
async function ensureSystemBlocksExist(businessProfileId: string): Promise<void> {
  const existing = await db.profileBlockLayout.findMany({
    where: { businessProfileId, blockKey: { in: SYSTEM_BLOCK_ORDER } },
    select: { blockKey: true },
  });
  const existingKeys = new Set(existing.map((row) => row.blockKey));
  const missing = SYSTEM_BLOCK_ORDER.filter((key) => !existingKeys.has(key));
  if (missing.length === 0) return;

  await db.profileBlockLayout.createMany({
    data: missing.map((key) => ({
      businessProfileId,
      blockKey: key,
      position: BLOCK_REGISTRY[key].defaultPosition,
      isVisible: true,
    })),
    skipDuplicates: true,
  });
}

function toResolvedBlock(
  row: { id: string; blockKey: ProfileBlockKey; position: number; isVisible: boolean; config: unknown },
  availability: Record<ProfileBlockKey, boolean>
): ResolvedBlock {
  const def = BLOCK_REGISTRY[row.blockKey];
  return {
    id: row.id,
    key: row.blockKey,
    label: def.label,
    description: def.description,
    position: row.position,
    isVisible: row.isVisible,
    config: (row.config as Record<string, unknown> | null) ?? null,
    isAvailable: availability[row.blockKey],
  };
}

/**
 * Resolves the full system-block list for the Builder, addressed by
 * real row id and sorted by position. This is the Builder's
 * read path — the public page uses getResolvedBlockLayoutForSlug below,
 * which does NOT lazily create rows (a public page view must never
 * write to the database).
 */
export async function getResolvedBlockLayout(
  organizationId: string,
  availability: Record<ProfileBlockKey, boolean>
): Promise<ResolvedBlock[]> {
  const businessProfileId = await getBusinessProfileId(organizationId);
  await ensureSystemBlocksExist(businessProfileId);

  const rows = await db.profileBlockLayout.findMany({
    where: { businessProfileId },
    orderBy: { position: "asc" },
  });

  return rows.map((row) => toResolvedBlock(row, availability));
}

/**
 * Public-page read path. Deliberately read-only (never calls
 * ensureSystemBlocksExist) — a business that has never had its Builder
 * opened has zero ProfileBlockLayout rows, and this falls back to the
 * registry's default order/visibility for the 7 system blocks, with no
 * This keeps every pre-existing business backward-compatible without a
 * block-row backfill migration.
 */
export async function getResolvedBlockLayoutForSlug(
  slug: string,
  availability: Record<ProfileBlockKey, boolean>
): Promise<ResolvedBlock[] | null> {
  const organization = await db.organization.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true, profile: { select: { id: true } } },
  });
  if (!organization || !organization.profile) return null;

  const rows = await db.profileBlockLayout.findMany({
    where: { businessProfileId: organization.profile.id },
    orderBy: { position: "asc" },
  });
  const savedKeys = new Set(rows.map((r) => r.blockKey));

  const resolved: ResolvedBlock[] = rows.map((row) => toResolvedBlock(row, availability));

  // Any system block with no saved row yet renders at its registry
  // default — this is the exact mechanism that keeps a business that
  // has never opened the Builder rendering unchanged.
  for (const key of SYSTEM_BLOCK_ORDER) {
    if (savedKeys.has(key)) continue;
    const def = BLOCK_REGISTRY[key];
    resolved.push({
      id: `default:${key}`,
      key,
      label: def.label,
      description: def.description,
      position: def.defaultPosition,
      isVisible: true,
      config: null,
      isAvailable: availability[key],
    });
  }

  return resolved.sort((a, b) => a.position - b.position);
}

async function findOwnedBlock(organizationId: string, blockId: string) {
  const businessProfileId = await getBusinessProfileId(organizationId);
  const block = await db.profileBlockLayout.findUnique({ where: { id: blockId } });
  if (!block || block.businessProfileId !== businessProfileId) {
    throw new BlockNotFoundError();
  }
  return block;
}

export async function setBlockVisibility(organizationId: string, blockId: string, isVisible: boolean) {
  const block = await findOwnedBlock(organizationId, blockId);
  return db.profileBlockLayout.update({ where: { id: block.id }, data: { isVisible } });
}

export async function updateBlockConfig(
  organizationId: string,
  blockId: string,
  config: Prisma.InputJsonObject
) {
  const block = await findOwnedBlock(organizationId, blockId);
  return db.profileBlockLayout.update({ where: { id: block.id }, data: { config } });
}

/**
 * Reorders by a full list of row ids — not keys — since repeatable
 * blocks mean multiple rows can share a key. Validates the given ids
 * are exactly this business's current set of blocks (same length, same
 * set, no duplicates) before persisting.
 */
export async function reorderBlockLayout(organizationId: string, orderedIds: string[]) {
  const businessProfileId = await getBusinessProfileId(organizationId);
  await ensureSystemBlocksExist(businessProfileId);

  const existing = await db.profileBlockLayout.findMany({
    where: { businessProfileId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((row) => row.id));

  const isValidPermutation =
    orderedIds.length === existingIds.size &&
    new Set(orderedIds).size === orderedIds.length &&
    orderedIds.every((id) => existingIds.has(id));

  if (!isValidPermutation) {
    throw new BlockOperationNotAllowedError("The provided order doesn't match this profile's blocks.");
  }

  await db.$transaction(
    orderedIds.map((id, index) => db.profileBlockLayout.update({ where: { id }, data: { position: index } }))
  );
}

export async function createCustomBlock(
  organizationId: string,
  blockKey: ProfileBlockKey,
  config: Prisma.InputJsonObject
) {
  const def = BLOCK_REGISTRY[blockKey];
  if (!def.addable || !def.repeatable) {
    throw new BlockOperationNotAllowedError(`${def.label} cannot be added directly.`);
  }

  const businessProfileId = await getBusinessProfileId(organizationId);
  const maxPosition = await db.profileBlockLayout.aggregate({
    where: { businessProfileId },
    _max: { position: true },
  });
  const nextPosition = (maxPosition._max.position ?? -1) + 1;

  return db.profileBlockLayout.create({
    data: { businessProfileId, blockKey, position: nextPosition, isVisible: true, config },
  });
}

export async function duplicateBlock(organizationId: string, blockId: string) {
  const block = await findOwnedBlock(organizationId, blockId);
  const def = BLOCK_REGISTRY[block.blockKey];
  if (!def.duplicatable) {
    throw new BlockOperationNotAllowedError(`${def.label} cannot be duplicated.`);
  }

  const maxPosition = await db.profileBlockLayout.aggregate({
    where: { businessProfileId: block.businessProfileId },
    _max: { position: true },
  });
  const nextPosition = (maxPosition._max.position ?? -1) + 1;

  return db.profileBlockLayout.create({
    data: {
      businessProfileId: block.businessProfileId,
      blockKey: block.blockKey,
      position: nextPosition,
      isVisible: block.isVisible,
      config: block.config ?? undefined,
    },
  });
}

export async function deleteBlock(organizationId: string, blockId: string) {
  const block = await findOwnedBlock(organizationId, blockId);
  const def = BLOCK_REGISTRY[block.blockKey];
  if (!def.deletable) {
    throw new BlockOperationNotAllowedError(`${def.label} cannot be deleted.`);
  }
  await db.profileBlockLayout.delete({ where: { id: block.id } });
}
