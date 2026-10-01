import { z } from "zod";
import type { CSSProperties } from "react";

// Optional values inherit. No defaults are written over a saved legacy design.
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/).describe("color");
const px = (max: number, min = 0) => z.number().min(min).max(max);
const align = z.enum(["LEFT", "CENTER", "RIGHT"]);
export const visualSurface = z.object({
  variant: z.enum(["SOLID", "TRANSPARENT", "OUTLINE", "SOFT", "ELEVATED", "GLASS"]).optional(),
  color: color.optional(), opacity: px(100).optional(), gradientColor: color.optional(),
  gradientAngle: px(360).optional(), borderColor: color.optional(), borderWidth: px(4).optional(),
  radius: px(48).optional(), shadow: z.enum(["NONE", "SOFT", "LIFTED"]).optional(),
  blur: px(24).optional(), glow: px(24).optional(), glowColor: color.optional(),
}).strict();
export const visualText = z.object({
  font: z.enum(["SANS", "SERIF", "MONO", "HUMANIST"]).optional(),
  size: px(64, 12).optional(), weight: z.enum(["400", "500", "600", "700", "800"]).optional(),
  lineHeight: z.number().min(1.1).max(2).optional(), tracking: z.number().min(-1).max(4).optional(),
  align: align.optional(), color: color.optional(),
}).strict();
export const visualLayout = z.object({
  mode: z.enum(["STACK", "ROW", "GRID", "CAROUSEL", "COMPACT", "ICON_ACTIONS"]).optional(),
  columns: px(4, 1).int().optional(), mobileColumns: px(2, 1).int().optional(),
  gap: px(40).optional(), padding: px(40).optional(), before: px(80).optional(), after: px(80).optional(),
  maxWidth: px(960, 240).optional(), align: align.optional(),
}).strict();
export const visualAction = z.object({
  minHeight: px(160, 44).optional(), padding: px(32, 8).optional(),
  align: align.optional(), iconPosition: z.enum(["LEFT", "RIGHT", "TOP", "TILE", "NONE"]).optional(),
  iconSize: px(48, 16).optional(), iconContainerSize: px(72, 24).optional(),
  iconRadius: px(36).optional(), iconColor: color.optional(), iconBackground: color.optional(),
  textColor: color.optional(), secondaryColor: color.optional(), chevron: z.boolean().optional(),
}).strict();
export const visualOverride = z.object({
  surface: visualSurface.optional(), layout: visualLayout.optional(),
  text: visualText.optional(), action: visualAction.optional(),
}).strict();
export const linkStyle = visualOverride.omit({layout:true}).extend({ subtitle: z.string().max(200).optional() }).strict();
export const sectionVisualFields = {
  visual: visualOverride.optional(),
  linkStyles: z.record(z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/), linkStyle)
    .refine(v => Object.keys(v).length <= 200, "Maximum 200 link styles.").optional(),
};
export const itemVisualFields = { visual: visualOverride.optional() };
export const heroDesign = z.object({
  composition: z.enum(["COVER_OVERLAP", "IMAGE_HERO", "CENTERED", "MINIMAL", "PORTRAIT"]).optional(),
  height: px(600, 80).optional(), mobileHeight: px(500, 80).optional(),
  fit: z.enum(["COVER", "CONTAIN"]).optional(), focalX: px(100).optional(), focalY: px(100).optional(),
  overlayColor: color.optional(), overlayOpacity: px(90).optional(),
  avatarSize: px(240, 40).optional(), avatarRadius: px(120).optional(),
  avatarBorder: px(8).optional(), avatarBorderColor: color.optional(),
  avatarShadow: z.enum(["NONE", "SOFT", "LIFTED"]).optional(), overlap: px(120).optional(),
  align: align.optional(), padding: px(48, 8).optional(), paddingBottom: px(48).optional(), gap: px(32).optional(),
  identityPosition: z.enum(["BELOW", "OVER_IMAGE"]).optional(),
  tagline: z.string().max(150).optional(), description: z.string().max(400).optional(),
  textOrder: z.enum(["NAME_FIRST", "TAGLINE_FIRST"]).optional(),
  showBusinessType: z.boolean().optional(), curvedEdge: px(80).optional(),
  minHeight: px(600).optional(),
}).strict();
export const badgeDesign = z.object({
  variant: z.enum(["CIRCLE", "SEAL", "CHECK", "SHIELD", "BETA"]).optional(), size: px(40, 16).optional(),
  color: color.optional(), checkColor: color.optional(), placement: z.enum(["NAME", "AVATAR"]).optional(),
}).strict();
export const canvasDesign = z.object({
  background: z.enum(["EXISTING", "SOLID", "GRADIENT", "IMAGE"]).optional(),
  color: color.optional(), gradientColor: color.optional(), gradientAngle: px(360).optional(),
  imageFit: z.enum(["COVER", "CONTAIN", "AUTO"]).optional(),
  focalX: px(100).optional(), focalY: px(100).optional(), repeat: z.boolean().optional(),
  overlayColor: color.optional(), overlayOpacity: px(90).optional(),
  maxWidth: px(960, 280).optional(), padding: px(40, 8).optional(), gap: px(48).optional(),
  appearance: z.enum(["LIGHT", "DARK"]).optional(),
  imageSource: z.enum(["BACKGROUND", "COVER"]).optional(),
  backgroundBlur: px(100).optional(),
}).strict();
export const typographyDesign = z.object({
  name: visualText.optional(), heading: visualText.optional(), body: visualText.optional(),
  label: visualText.optional(), caption: visualText.optional(),
}).strict();
export const profileVisual = z.object({
  version: z.literal(1), canvas: canvasDesign.optional(), hero: heroDesign.optional(),
  badge: badgeDesign.optional(), surface: visualSurface.optional(), action: visualAction.optional(),
  typography: typographyDesign.optional(),
  primaryAction: visualOverride.omit({layout:true}).optional(),
  socials: visualOverride.omit({layout:true}).optional(),
}).strict();
export const footerVisual = visualOverride.omit({action:true}).extend({
  decoration: z.enum(["NONE", "LINE", "HEART", "STAR"]).optional(),
}).strict();
export const mediaVisual = z.object({
  layout: z.enum(["CAROUSEL", "ROW", "GRID", "FEATURED"]).optional(),
  columns: px(4, 1).int().optional(), mobileColumns: px(2, 1).int().optional(),
  gap: px(32).optional(), radius: px(40).optional(),
  fit: z.enum(["COVER", "CONTAIN"]).optional(), focalX: px(100).optional(), focalY: px(100).optional(),
}).strict();
export type ProfileVisual = z.infer<typeof profileVisual>;
export type VisualOverride = z.infer<typeof visualOverride>;
export type VisualSurface = z.infer<typeof visualSurface>;
export type VisualText = z.infer<typeof visualText>;
export type VisualAction = z.infer<typeof visualAction>;
export function roleTextCSS(typography:ProfileVisual["typography"],role:keyof NonNullable<ProfileVisual["typography"]>):CSSProperties {
  const defaults:Record<typeof role,VisualText>={name:{size:30,weight:"700",lineHeight:1.2},heading:{size:20,weight:"600",lineHeight:1.35},body:{size:16,lineHeight:1.55},label:{size:16,weight:"500",lineHeight:1.35},caption:{size:13,lineHeight:1.45}};
  return textCSS({...defaults[role],...typography?.[role]});
}
export const fonts = { SANS: "Arial, sans-serif", SERIF: "Georgia, serif", MONO: "monospace", HUMANIST: "Verdana, sans-serif" };
export const shadows = { NONE: "none", SOFT: "0 4px 16px #00000014", LIFTED: "0 12px 32px #00000030" };
export function readableText(color:string) {
  const c=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return c[0]*.2126+c[1]*.7152+c[2]*.0722>.179?"#172033":"#ffffff";
}
function defined(style:CSSProperties):CSSProperties { return Object.fromEntries(Object.entries(style).filter(([,value])=>value!==undefined)); }
export function textCSS(t?: VisualText): CSSProperties {
  return t ? defined({ fontFamily: t.font && fonts[t.font], fontSize: t.size, fontWeight: t.weight,
    lineHeight: t.lineHeight, letterSpacing: t.tracking, textAlign: t.align?.toLowerCase() as CSSProperties["textAlign"], color: t.color }) : {};
}
export function surfaceCSS(s?: VisualSurface): CSSProperties {
  if (!s||!Object.keys(s).length) return {};
  const variant = s.variant;
  const opacity = s.opacity ?? (variant === "GLASS" ? 24 : variant === "SOFT" ? 12 : 100);
  const fill = `color-mix(in srgb, ${s.color ?? "var(--v2-surface, #ffffff)"} ${opacity}%, transparent)`;
  const base = variant === "TRANSPARENT" || variant === "OUTLINE" ? "transparent" : fill;
  const glow = s.glow ? `0 0 ${s.glow}px ${s.glowColor ?? s.borderColor ?? "#6486ff"}` : "";
  const shadow = s.shadow ? shadows[s.shadow] : variant === "ELEVATED" ? shadows.LIFTED : variant ? "none" : undefined;
  return defined({ color:s.color&&opacity>=85&&variant!=="TRANSPARENT"&&variant!=="OUTLINE"?readableText(s.color):undefined,
    background: s.gradientColor && !["TRANSPARENT", "OUTLINE"].includes(variant ?? "") ? `linear-gradient(${s.gradientAngle ?? 135}deg, ${base}, ${s.gradientColor})` : s.color||s.variant||s.opacity!==undefined?base:undefined,
    borderStyle: "solid", borderWidth: s.borderWidth ?? (variant === "OUTLINE" || variant === "GLASS" ? 1 : variant ? 0 : undefined),
    borderColor: s.borderColor ?? "#94a3b8", borderRadius: s.radius,
    backdropFilter: s.blur !== undefined || variant === "GLASS" ? `blur(${s.blur ?? 12}px)` : variant ? "none" : undefined,
    boxShadow: glow ? [shadow === "none" ? undefined : shadow, glow].filter(Boolean).join(",") : shadow });
}
export function actionCSS(a?: VisualAction): CSSProperties {
  if (!a) return {};
  return defined({ minHeight: a.minHeight, padding: a.padding, color: a.textColor,
    textAlign: a.align?.toLowerCase() as CSSProperties["textAlign"],
    justifyContent: a.align && { LEFT: "flex-start", CENTER: "center", RIGHT: "flex-end" }[a.align],
    flexDirection: a.iconPosition === "TOP" ? "column" : a.iconPosition === "RIGHT" ? "row-reverse" : undefined });
}
export function collectionCSS(l?:VisualOverride["layout"]):CSSProperties {
  return l?{"--visual-gap":`${l.gap??(l.mode==="COMPACT"?6:12)}px`,"--visual-columns":l.columns??(l.mode==="ICON_ACTIONS"?4:2),"--visual-mobile-columns":l.mobileColumns??(l.mode==="ICON_ACTIONS"?2:1)} as CSSProperties:{};
}
export function layoutCSS(l?: VisualOverride["layout"]): CSSProperties {
  if (!l) return {};
  return { padding: l.padding, marginTop: l.before, marginBottom: l.after, maxWidth: l.maxWidth,
    marginLeft: l.align === "RIGHT" || l.align === "CENTER" ? "auto" : undefined,
    marginRight: l.align === "LEFT" || l.align === "CENTER" ? "auto" : undefined,
    "--visual-gap": `${l.gap ?? (l.mode === "COMPACT" ? 6 : 12)}px`,
    "--visual-columns": l.columns ?? (l.mode === "ICON_ACTIONS" ? 4 : 2),
    "--visual-mobile-columns": l.mobileColumns ?? (l.mode === "ICON_ACTIONS" ? 2 : 1),
  } as CSSProperties;
}
/** Merge one level of primitive groups; omission retains the parent, not a reset. */
export function inheritVisual(...levels: (VisualOverride | undefined)[]): VisualOverride {
  return levels.reduce<VisualOverride>((out, level) => {
    if (!level) return out;
    return { surface: { ...out.surface, ...level.surface }, action: { ...out.action, ...level.action },
      text: { ...out.text, ...level.text }, layout: { ...out.layout, ...level.layout } };
  }, {});
}
export function readVisual(value: unknown): VisualOverride {
  const result = visualOverride.safeParse(value); return result.success ? result.data : {};
}
