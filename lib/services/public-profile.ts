import "server-only";
import { db } from "@/lib/db";

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
      name: true,
      businessType: true,
      profile: {
        select: {
          displayName: true,
          bio: true,
          logoUrl: true,
          coverImageUrl: true,
          themeColor: true,
          phone: true,
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

  return {
    ...organization,
    profile: organization.profile,
  };
}

export type PublicBusinessProfile = NonNullable<
  Awaited<ReturnType<typeof getPublicBusinessProfile>>
>;
