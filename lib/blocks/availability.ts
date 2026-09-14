import type { ProfileBlockKey } from "@prisma/client";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import type { ProfileViewModel } from "@/lib/profileView";

export function computeBlockAvailability(input: {
  bio: string | null;
  hasContactAction: boolean;
  hasLocationAction: boolean;
  hasReviewsLink: boolean;
  menuAvailable: boolean;
  secondaryLinksCount: number;
  businessInfoRowsCount: number;
}): Record<ProfileBlockKey, boolean> {
  return {
    BIO: Boolean(input.bio),
    CONTACT: input.hasContactAction,
    LOCATION: input.hasLocationAction,
    REVIEWS: input.hasReviewsLink,
    MENU: input.menuAvailable,
    LINKS: input.secondaryLinksCount > 0,
    BUSINESS_INFO: input.businessInfoRowsCount > 0,
    HEADING: true,
    TEXT: true,
    DIVIDER: true,
  };
}

export function computeAvailabilityFromViewModel(
  business: PublicBusinessProfile,
  viewModel: ProfileViewModel,
  menuAvailable: boolean
): Record<ProfileBlockKey, boolean> {
  return computeBlockAvailability({
    bio: business.profile.bio,
    hasContactAction: Boolean(viewModel.callHref || viewModel.whatsappHref),
    hasLocationAction: Boolean(viewModel.directionsHref),
    hasReviewsLink: Boolean(viewModel.reviewsHref),
    menuAvailable,
    secondaryLinksCount: viewModel.secondaryLinks.length,
    businessInfoRowsCount: viewModel.businessInfoRows.length,
  });
}
