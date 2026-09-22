import "server-only";
import {PLATFORM_NAME} from "@/lib/platform";
import { db } from "@/lib/db";
import { getV2Data } from "@/lib/services/profile-v2";
import type { V2Data } from "@/lib/profile-v2";
import {
  normalizeBackgroundGradient,
  normalizeBackgroundMode,
  normalizeBackgroundType,
} from "@/lib/background";

/**
 * Loads everything the public /[businessSlug] page is allowed to show,
 * and nothing else — deliberately kept separate from the admin-facing
 * organizations service, which has different trust assumptions.
 *
 * Only ACTIVE organizations are matched: a SUSPENDED or ARCHIVED
 * business and a genuinely nonexistent slug both resolve to `null`
 * here, so the page renders an identical 404 either way rather than
 * leaking that a suspended business exists.
 *
 * An explicit `select` (not `include`) is used throughout so that
 * fields like ownerUserId, subscriptions, or any sensitive column
 * added to these models in the future cannot accidentally leak into
 * this public response just because a relation was included.
 */
export async function getPublicBusinessProfile(slug: string) {
  const organization = await db.organization.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
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
            select: {
              id: true,
              type: true,
              label: true,
              url: true,
            },
          },
        },
      },
    },
  });

  // BusinessProfile is created atomically with every Organization (see
  // createOrganization), so an ACTIVE organization always has one in
  // practice — but Prisma's generated type still marks the 1:1 relation
  // as nullable, since nothing in the schema itself enforces that
  // invariant. Narrowing it here, once, means every caller (this page's
  // generateMetadata and the page component) gets a non-null `profile`
  // instead of repeating a null check everywhere.
  if (!organization || !organization.profile) {
    return null;
  }

  const v2=organization.profile.builderVersion===2 ? await getV2Data(organization.id) : undefined;
  const branding=organization.profile.builderVersion===2 ? {platformName:PLATFORM_NAME} : undefined;

  return {
    name: organization.name,
    businessType: organization.businessType,
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

export type PublicBusinessProfile = Omit<NonNullable<
  Awaited<ReturnType<typeof getPublicBusinessProfile>>
>, "v2" | "profile" | "branding"> & { branding?:{platformName:string}; v2?: V2Data; profile: Omit<NonNullable<Awaited<ReturnType<typeof getPublicBusinessProfile>>>["profile"], "builderVersion" | "isVerified" | "verificationColor" | "verificationTooltip"> & { builderVersion?: number; isVerified?: boolean; verificationColor?: string; verificationTooltip?:string|null } };
