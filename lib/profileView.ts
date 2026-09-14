import { buildLinkHref, isRenderableLinkValue } from "@/lib/linkTypes";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";

type ProfileLinkLike = PublicBusinessProfile["profile"]["links"][number];

export interface BusinessInfoRow {
  key: string;
  label: string;
  href?: string;
}

export interface ProfileViewModel {
  callHref?: string;
  whatsappHref?: string;
  directionsHref?: string;
  reviewsHref?: string;
  secondaryLinks: ProfileLinkLike[];
  businessInfoRows: BusinessInfoRow[];
}

/**
 * Pure derivation from raw profile data to "what actually renders and
 * where." No React, no fetching — just data in, view model out. This is
 * what makes it safe to call identically from a Server Component (the
 * public page) and from client-side state (the builder's live preview):
 * same function, same result, by construction.
 */
export function buildProfileViewModel(business: PublicBusinessProfile): ProfileViewModel {
  const { profile } = business;
  const renderableLinks = profile.links.filter((link) => isRenderableLinkValue(link.type, link.url));
  const linksByType = new Map(renderableLinks.map((link) => [link.type, link]));

  const whatsappLink = linksByType.get("WHATSAPP");
  const reviewsLink = linksByType.get("GOOGLE_REVIEWS");
  const mapsLink = linksByType.get("GOOGLE_MAPS");

  const callHref =
    profile.phone && isRenderableLinkValue("PHONE", profile.phone)
      ? buildLinkHref("PHONE", profile.phone)
      : undefined;
  const whatsappHref = whatsappLink ? buildLinkHref("WHATSAPP", whatsappLink.url) : undefined;
  const directionsHref = profile.googleMapsUrl
    ? profile.googleMapsUrl
    : mapsLink
      ? buildLinkHref("GOOGLE_MAPS", mapsLink.url)
      : undefined;
  const reviewsHref = reviewsLink ? buildLinkHref("GOOGLE_REVIEWS", reviewsLink.url) : undefined;

  // The four action types promoted into CONTACT/LOCATION/REVIEWS blocks
  // never appear a second time in the generic LINKS block.
  const secondaryLinks = renderableLinks.filter(
    (link) => !["PHONE", "WHATSAPP", "GOOGLE_MAPS", "GOOGLE_REVIEWS"].includes(link.type)
  );

  const hasExplicitWebsiteLink = linksByType.has("WEBSITE");
  const businessInfoRows: BusinessInfoRow[] = [
    profile.address ? { key: "address", label: profile.address } : null,
    profile.phone ? { key: "phone", label: profile.phone, href: buildLinkHref("PHONE", profile.phone) } : null,
    profile.website && !hasExplicitWebsiteLink
      ? { key: "website", label: profile.website.replace(/^https?:\/\//, ""), href: profile.website }
      : null,
  ].filter((row): row is BusinessInfoRow => row !== null);

  return { callHref, whatsappHref, directionsHref, reviewsHref, secondaryLinks, businessInfoRows };
}
