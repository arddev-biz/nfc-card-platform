import type { ProfileBlockKey } from "@prisma/client";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import type { ProfileViewModel } from "@/lib/profileView";
import { infoConfig, itemConfigs, type ItemKind, type V2Section } from "@/lib/profile-v2";
import { isRenderableLinkValue } from "@/lib/linkTypes";

export function isV2SectionAvailable(section: V2Section, business: PublicBusinessProfile, vm: ProfileViewModel, menuAvailable: boolean): boolean {
  const p = business.profile;
  const links = business.v2?.links.filter(l => l.isActive && isRenderableLinkValue(l.type,l.url)) ?? [];
  if (section.singletonKey === "BIO") return Boolean(p.bio);
  if (section.singletonKey === "MENU") return menuAvailable;
  if (section.singletonKey === "LINKS" || section.kind === "SOCIALS") return links.some(l => l.v2IsVisible && l.socialSectionId === (section.kind === "SOCIALS" ? section.id : null));
  if (section.singletonKey === "BUSINESS_INFO") {
    const config = infoConfig.safeParse(section.config); if (!config.success) return false;
    const c = config.data;
    return Boolean((c.phone && vm.callHref) || (c.whatsapp && vm.whatsappHref) || (c.email && p.email) ||
      (c.website && (links.some(l=>l.type==="WEBSITE") || p.website)) || (c.address && p.address) || (c.maps && vm.directionsHref));
  }
  return section.items.some(i => {
    if (!i.isVisible || !Object.prototype.hasOwnProperty.call(itemConfigs, i.kind) || !itemConfigs[i.kind as ItemKind].safeParse(i.config).success) return false;
    if (["TEXT","HEADING","ICON_TEXT"].includes(i.kind)) return Boolean(i.config.text);
    if (["IMAGE","CAROUSEL"].includes(i.kind)) return i.images.length > 0;
    if (i.kind === "LINK") return i.referencedProfileLinkId ? links.some(l => l.id === i.referencedProfileLinkId) : Boolean(i.config.url);
    if (i.kind === "MENU") return menuAvailable;
    if (i.kind === "SOCIAL") return links.some(l => l.id === i.referencedProfileLinkId);
    if (i.kind === "REVIEW") return Boolean(vm.reviewsHref);
    if (i.kind === "MAP") return Boolean(vm.directionsHref);
    if (i.kind === "CONTACT") return Boolean(i.config.action === "PHONE" ? vm.callHref : i.config.action === "WHATSAPP" ? vm.whatsappHref : i.config.action === "EMAIL" ? p.email : links.some(l => l.type === "WEBSITE") || p.website);
    return true;
  });
}

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
