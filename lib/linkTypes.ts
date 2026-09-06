import { LinkType } from "@prisma/client";

/** What kind of value a link type stores, which drives validation and the admin form's input type. */
export type LinkValueKind = "url" | "phone" | "email";

export interface LinkTypeMeta {
  /** Human-readable name of the type, shown in the admin type selector. */
  label: string;
  /** Label applied automatically when the admin leaves the label field blank. */
  defaultLabel: string;
  valueKind: LinkValueKind;
  /** Example placeholder shown in the admin form's value field. */
  placeholder: string;
}

export const LINK_TYPE_META: Record<LinkType, LinkTypeMeta> = {
  INSTAGRAM: {
    label: "Instagram",
    defaultLabel: "Instagram",
    valueKind: "url",
    placeholder: "https://instagram.com/yourbusiness",
  },
  FACEBOOK: {
    label: "Facebook",
    defaultLabel: "Facebook",
    valueKind: "url",
    placeholder: "https://facebook.com/yourbusiness",
  },
  TIKTOK: {
    label: "TikTok",
    defaultLabel: "TikTok",
    valueKind: "url",
    placeholder: "https://tiktok.com/@yourbusiness",
  },
  WHATSAPP: {
    label: "WhatsApp",
    defaultLabel: "WhatsApp",
    valueKind: "phone",
    placeholder: "+355 69 123 4567",
  },
  PHONE: {
    label: "Phone",
    defaultLabel: "Call Us",
    valueKind: "phone",
    placeholder: "+355 69 123 4567",
  },
  EMAIL: {
    label: "Email",
    defaultLabel: "Email Us",
    valueKind: "email",
    placeholder: "you@yourbusiness.com",
  },
  WEBSITE: {
    label: "Website",
    defaultLabel: "Website",
    valueKind: "url",
    placeholder: "https://yourbusiness.com",
  },
  GOOGLE_MAPS: {
    label: "Google Maps",
    defaultLabel: "Google Maps",
    valueKind: "url",
    placeholder: "https://maps.app.goo.gl/...",
  },
  GOOGLE_REVIEWS: {
    label: "Google Reviews",
    defaultLabel: "Leave us a Google Review",
    valueKind: "url",
    placeholder: "https://g.page/r/.../review",
  },
  BOOKING: {
    label: "Booking",
    defaultLabel: "Book Now",
    valueKind: "url",
    placeholder: "https://yourbookinglink.com",
  },
  CUSTOM: {
    label: "Custom",
    defaultLabel: "Learn More",
    valueKind: "url",
    placeholder: "https://...",
  },
};

/** All link types, in a sensible display order for the admin's type selector. */
export const LINK_TYPE_ORDER: LinkType[] = [
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "WHATSAPP",
  "WEBSITE",
  "PHONE",
  "EMAIL",
  "GOOGLE_MAPS",
  "GOOGLE_REVIEWS",
  "BOOKING",
  "CUSTOM",
];

export function getDefaultLabel(type: LinkType): string {
  return LINK_TYPE_META[type].defaultLabel;
}

function digitsAndPlus(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

/**
 * Builds the actual href for a link's stored value, based on its type.
 * This is the one place that knows about tel:/mailto:/wa.me — nothing
 * else in the app should construct these schemes directly, so adding a
 * future link type only means updating this file.
 */
export function buildLinkHref(type: LinkType, value: string): string {
  switch (type) {
    case "PHONE":
      return `tel:${digitsAndPlus(value)}`;
    case "WHATSAPP":
      return `https://wa.me/${digitsAndPlus(value).replace(/^\+/, "")}`;
    case "EMAIL":
      return `mailto:${value}`;
    default:
      return value;
  }
}

/**
 * Defense-in-depth check applied again at render time (in addition to
 * server-side validation at write time) before a link is ever rendered
 * as a clickable destination on the public profile. If stored data is
 * somehow malformed, the link is simply not rendered rather than
 * producing a broken or unsafe href.
 */
export function isRenderableLinkValue(type: LinkType, value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  switch (LINK_TYPE_META[type].valueKind) {
    case "phone":
      return /^[0-9+()\-\s]{6,20}$/.test(trimmed);
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    case "url":
    default:
      return /^https?:\/\//i.test(trimmed);
  }
}

/** Whether an anchor for this link type should open in a new tab. tel:/mailto: should not. */
export function opensInNewTab(type: LinkType): boolean {
  return type !== "PHONE" && type !== "WHATSAPP" && type !== "EMAIL"
    ? true
    : type === "WHATSAPP"; // WhatsApp opens wa.me in a new tab; phone/email stay in the same context
}
