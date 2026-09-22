import { buildLinkHref, isRenderableLinkValue } from "@/lib/linkTypes";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import type { V2Section } from "@/lib/profile-v2";

type ProfileLinkLike = PublicBusinessProfile["profile"]["links"][number];

export interface BusinessInfoRow {
  key: string;
  label: string;
  href?: string;
}

export interface ProfileViewModel {
  v2Sections?: V2Section[];
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
  const linkOfType = (type: ProfileLinkLike["type"]) =>
    renderableLinks.find((link) => link.type === type);

  const phoneLink = linkOfType("PHONE");
  const whatsappLink = linkOfType("WHATSAPP");
  const reviewsLink = linkOfType("GOOGLE_REVIEWS");
  const mapsLink = linkOfType("GOOGLE_MAPS");
  const websiteLink = linkOfType("WEBSITE");

  const phoneValue =
    profile.phone && isRenderableLinkValue("PHONE", profile.phone)
      ? profile.phone
      : phoneLink?.url;
  const whatsappValue = whatsappLink?.url ?? profile.whatsapp ?? undefined;

  const callHref = phoneValue ? buildLinkHref("PHONE", phoneValue) : undefined;
  const whatsappHref =
    whatsappValue && isRenderableLinkValue("WHATSAPP", whatsappValue)
      ? buildLinkHref("WHATSAPP", whatsappValue)
      : undefined;
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

  const businessInfoRows: BusinessInfoRow[] = [
    profile.address ? { key: "address", label: profile.address } : null,
    phoneValue ? { key: "phone", label: phoneValue, href: buildLinkHref("PHONE", phoneValue) } : null,
    profile.website && !websiteLink
      ? { key: "website", label: profile.website.replace(/^https?:\/\//, ""), href: profile.website }
      : null,
  ].filter((row): row is BusinessInfoRow => row !== null);

  return { callHref, whatsappHref, directionsHref, reviewsHref, secondaryLinks, businessInfoRows,
    v2Sections: business.v2?.version === 2 ? business.v2.sections.filter(s => s.isVisible).sort((a,b) => a.position - b.position) : undefined };
}
