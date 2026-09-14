import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBusinessProfile } from "@/lib/services/public-profile";
import { isMenuAvailableForSlug } from "@/lib/services/public-menu";
import { getResolvedBlockLayoutForSlug } from "@/lib/services/profile-blocks";
import { computeAvailabilityFromViewModel } from "@/lib/blocks/availability";
import { buildProfileViewModel } from "@/lib/profileView";
import { ProfileRenderer } from "@/components/profile/ProfileRenderer";

export const runtime = "nodejs";
// Block visibility/order and business status can change at any time via
// the admin — this page must never serve a stale cached decision.
export const dynamic = "force-dynamic";

interface PageProps {
  params: { businessSlug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const business = await getPublicBusinessProfile(params.businessSlug);

  if (!business || !business.profile) {
    return { title: "Business not found" };
  }

  const name = business.profile.displayName || business.name;

  return {
    title: name,
    description: business.profile.bio?.slice(0, 160) || `${name} — contact and links.`,
  };
}

export default async function PublicBusinessProfilePage({ params }: PageProps) {
  const business = await getPublicBusinessProfile(params.businessSlug);

  if (!business) {
    notFound();
  }

  const menuAvailable = await isMenuAvailableForSlug(params.businessSlug);
  const viewModel = buildProfileViewModel(business);

  const availability = computeAvailabilityFromViewModel(business, viewModel, menuAvailable);

  const resolvedBlocks = await getResolvedBlockLayoutForSlug(params.businessSlug, availability);
  // Only ever null if the organization vanished between the two lookups
  // above (or was suspended/archived in that instant) — treat identically
  // to "not found", matching every other public lookup's behavior.
  if (!resolvedBlocks) {
    notFound();
  }

  const visibleBlocks = resolvedBlocks.filter((block) => block.isVisible && block.isAvailable);

  return (
    <ProfileRenderer
      business={business}
      viewModel={viewModel}
      blocks={visibleBlocks}
      menuAvailable={menuAvailable}
      slug={params.businessSlug}
    />
  );
}
