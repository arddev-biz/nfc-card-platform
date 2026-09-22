import type { FollowerState } from "@/lib/social-followers";
import { profileDesign, footerConfig, surfaceFields, type ProfileDesign } from "@/lib/profile-design";
import { z } from "zod";
import { profileLinkInputSchema } from "@/lib/validation/profile-links";
import { PHONE_PATTERN } from "@/lib/validation/shared";

export const coreKeys = ["BIO", "BUSINESS_INFO", "LINKS", "MENU"] as const;
export const itemKinds = ["HEADING", "TEXT", "LINK", "IMAGE", "CAROUSEL", "DIVIDER", "SPACER", "ICON_TEXT", "CONTACT", "MAP", "REVIEW", "SOCIAL", "MENU"] as const;
export const networks = ["INSTAGRAM", "FACEBOOK", "TIKTOK", "YOUTUBE", "LINKEDIN", "X"] as const;
export const httpUrl = z.string().trim().max(1000).url().refine(v => /^https?:\/\//i.test(v), "Use an http or https URL.");
const id = z.string().min(1).max(100);
const textStyle = {
  ...surfaceFields,
  lineHeight: z.enum(["TIGHT","NORMAL","RELAXED"]).default("NORMAL"),
  letterSpacing: z.enum(["TIGHT","NORMAL","WIDE"]).default("NORMAL"),
  align: z.enum(["LEFT", "CENTER", "RIGHT"]).default("LEFT"),
  size: z.enum(["SMALL", "DEFAULT", "LARGE"]).default("DEFAULT"),
  weight: z.enum(["REGULAR", "MEDIUM", "BOLD"]).default("REGULAR"),
  italic: z.boolean().default(false),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),
};
export const textConfig = z.object(textStyle).strict();
export const infoConfig = z.object({
  ...surfaceFields,
  phone: z.boolean().default(false), whatsapp: z.boolean().default(false),
  email: z.boolean().default(false), website: z.boolean().default(false),
  address: z.boolean().default(false), maps: z.boolean().default(false),
}).strict();
export const socialConfig = z.object({
  containerStyle:z.enum(["ICON_ONLY","FILLED","OUTLINE"]).default("ICON_ONLY"),
  shape:z.enum(["CIRCLE","ROUNDED","SQUARE"]).default("CIRCLE"),
  containerColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  border:z.boolean().default(false),
  borderColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  ...surfaceFields,
  showFollowerCount: z.boolean().default(false),
  iconColor: z.enum(["INHERIT","THEME","MONOCHROME","BRAND"]).default("INHERIT"),
  spacing: z.enum(["COMPACT","COMFORTABLE","SPACIOUS"]).default("COMFORTABLE"),
  align: z.enum(["LEFT", "CENTER", "RIGHT"]).default("CENTER"),
  iconSize: z.enum(["SMALL", "MEDIUM", "LARGE"]).default("MEDIUM"),
  labels: z.boolean().default(false),
}).strict();
export const mediaConfig = z.object({
  ...surfaceFields,
  ratio: z.enum(["AUTO", "SQUARE", "PORTRAIT", "LANDSCAPE"]).default("AUTO"),
  mode: z.enum(["SLIDE", "CONTINUOUS"]).default("SLIDE"),
  autoplay: z.boolean().default(false), loop: z.boolean().default(true),
  speed: z.enum(["SLOW", "NORMAL", "FAST"]).default("SLOW"),
  pagination: z.boolean().default(true), resume: z.boolean().default(false),
}).strict();
export const itemConfigs = {
  HEADING: z.object({ text: z.string().max(500).default(""), ...textStyle }).strict(),
  TEXT: z.object({ text: z.string().max(10000).default(""), ...textStyle }).strict(),
  ICON_TEXT: z.object({ text: z.string().max(3000).default(""), icon: z.enum(["STAR", "HEART", "CHECK", "PIN"]).default("STAR"), ...textStyle }).strict(),
  LINK: z.object({ ...surfaceFields, label: z.string().max(100).default("Link"), url: httpUrl.or(z.literal("")).default("") }).strict(),
  MENU: z.object({ ...surfaceFields, label: z.string().max(100).default("View Menu") }).strict(),
  IMAGE: mediaConfig, CAROUSEL: mediaConfig,
  DIVIDER: z.object({}).strict(),
  SPACER: z.object({ size: z.enum(["SMALL", "MEDIUM", "LARGE"]).default("MEDIUM") }).strict(),
  CONTACT: z.object({ ...surfaceFields, action: z.enum(["PHONE", "WHATSAPP", "EMAIL", "WEBSITE"]).default("PHONE"), label: z.string().max(100).default("") }).strict(),
  MAP: z.object({ ...surfaceFields, label: z.string().max(100).default("Directions") }).strict(),
  REVIEW: z.object({ ...surfaceFields, label: z.string().max(100).default("Google Reviews") }).strict(),
  SOCIAL: z.object({ ...surfaceFields, label: z.string().max(100).default("Social") }).strict(),
};
export type ItemKind = keyof typeof itemConfigs;
export function parseSectionConfig(key: string | null, value: unknown) {
  if (key === "BIO") return textConfig.parse(value);
  if (key === "BUSINESS_INFO") return infoConfig.parse(value);
  if (key === "SOCIALS") return socialConfig.parse(value);
  return z.object(surfaceFields).strict().parse(value);
}
export const sectionData = z.object({
  internalName: z.string().trim().min(1).max(100),
  visibleTitle: z.string().max(150).nullable(),
  isVisible: z.boolean(), config: z.record(z.unknown()),
}).strict();
export const itemData = z.object({
  kind: z.enum(itemKinds), width: z.enum(["FULL", "HALF"]), isVisible: z.boolean(),
  config: z.record(z.unknown()), referencedProfileLinkId: id.nullable().default(null),
}).strict();
export const linkPresentation = z.object({
  width: z.enum(["FULL", "HALF"]), iconMode: z.enum(["DEFAULT", "CUSTOM", "NONE"]),
  customIconAssetId: id.nullable(), socialSectionId: id.nullable(),
  socialNetwork: z.enum(networks).nullable(), v2IsVisible: z.boolean(),
}).strict().refine(v => v.iconMode !== "CUSTOM" || !!v.customIconAssetId, "Upload a custom icon first.");
export const imageData = z.object({
  assetId: id, alt: z.string().max(300), caption: z.string().max(500).nullable(),
  destinationUrl: httpUrl.nullable(),
}).strict();
const orderedIds = z.array(id).max(200);
export const v2Command = z.discriminatedUnion("op", [
  z.object({ op: z.literal("section-create"), kind: z.enum(["CUSTOM", "SOCIALS"]) }).strict(),
  z.object({ op: z.literal("section-update"), id, data: sectionData }).strict(),
  z.object({ op: z.literal("section-delete"), id }).strict(),
  z.object({ op: z.literal("section-duplicate"), id }).strict(),
  z.object({ op: z.literal("section-order"), orderedIds }).strict(),
  z.object({ op: z.literal("item-create"), sectionId: id, data: itemData }).strict(),
  z.object({ op: z.literal("item-update"), id, data: itemData }).strict(),
  z.object({ op: z.literal("item-delete"), id }).strict(),
  z.object({ op: z.literal("item-duplicate"), id }).strict(),
  z.object({ op: z.literal("item-order"), sectionId: id, orderedIds }).strict(),
  z.object({ op: z.literal("image-create"), itemId: id, data: imageData }).strict(),
  z.object({ op: z.literal("image-update"), id, data: imageData }).strict(),
  z.object({ op: z.literal("image-delete"), id }).strict(),
  z.object({ op: z.literal("image-order"), itemId: id, orderedIds }).strict(),
  z.object({ op: z.literal("link-presentation"), id, data: linkPresentation }).strict(),
  z.object({ op: z.literal("link-save"), id: id.nullable(), data: profileLinkInputSchema, presentation: linkPresentation }).strict(),
  z.object({ op: z.literal("link-delete"), id }).strict(),
  z.object({ op: z.literal("link-order"), socialSectionId: id.nullable(), orderedIds }).strict(),
  z.object({op:z.literal("footer"),data:footerConfig}).strict(),
  z.object({ op: z.literal("design"), data: profileDesign }).strict(),
  z.object({ op: z.literal("theme"), theme: z.enum(["CLASSIC", "LIQUID_GLASS"]) }).strict(),
  z.object({ op: z.literal("info"), data: z.object({
    phone: z.string().trim().max(30).regex(PHONE_PATTERN).or(z.literal("")).nullable(),
    email: z.string().trim().max(200).email().or(z.literal("")).nullable(),
    address: z.string().trim().max(300).nullable(), googleMapsUrl: httpUrl.or(z.literal("")).nullable(),
    whatsapp: z.string().trim().max(30).regex(PHONE_PATTERN).or(z.literal("")).nullable(), website: httpUrl.or(z.literal("")).nullable(),
  }).strict() }).strict(),
]);
export const v2Request = z.object({ revision: z.number().int().nonnegative(), command: v2Command }).strict();
export type V2Command = z.infer<typeof v2Command>;
export interface V2Image { id: string; assetId: string; url: string; position: number; alt: string; caption: string | null; destinationUrl: string | null }
export interface V2Item { id: string; kind: string; position: number; width: string; isVisible: boolean; config: Record<string, unknown>; referencedProfileLinkId: string | null; images: V2Image[] }
export interface V2Section { id: string; kind: string; singletonKey: string | null; internalName: string; visibleTitle: string | null; position: number; isVisible: boolean; config: Record<string, unknown>; items: V2Item[] }
export interface V2Link {
  followers?: FollowerState;
  id: string; type: z.infer<typeof profileLinkInputSchema>["type"]; label: string | null; url: string;
  isActive: boolean; width: string; iconMode: string; v2IsVisible: boolean; customIconAssetId: string | null;
  iconUrl: string | null; socialSectionId: string | null; socialNetwork: string | null;
}
export interface V2Data { version: number; revision: number; theme: string; design?: ProfileDesign; sections: V2Section[]; links: V2Link[] }
export function assertExactOrder(existing: string[], proposed: string[]) {
  if (existing.length !== proposed.length || new Set(proposed).size !== proposed.length || existing.some(id => !proposed.includes(id))) throw new Error("Order changed. Reload and try again.");
}
export function textStyleValues(config: unknown) {
  const parsed = textConfig.safeParse(config);
  const c = parsed.success ? parsed.data : textConfig.parse({});
  return { textAlign: ({ LEFT: "left", CENTER: "center", RIGHT: "right" } as const)[c.align],
    fontSize: { SMALL: "0.875rem", DEFAULT: "1rem", LARGE: "1.5rem" }[c.size],
    fontWeight: { REGULAR: 400, MEDIUM: 500, BOLD: 700 }[c.weight],
    lineHeight: {TIGHT:1.2,NORMAL:1.5,RELAXED:1.8}[c.lineHeight], letterSpacing:{TIGHT:"-0.025em",NORMAL:"0em",WIDE:"0.06em"}[c.letterSpacing],
    fontStyle: c.italic ? "italic" : "normal", color: c.color ?? undefined };
}
