import { z } from "zod";
import { profileVisual, footerVisual } from "./profile-visual";
import type { ProfileVisual } from "./profile-visual";

export const surfaceConfig = z.object({
  preset: z.enum(["INHERIT", "NONE", "MINIMAL", "CARD"]).default("INHERIT"),
  border: z.boolean().optional(), background: z.boolean().optional(),
  padding: z.boolean().optional(), shadow: z.boolean().optional(),
}).strict();
export const surfaceFields = { surface: surfaceConfig.optional() };
export const footerConfig = z.object({hidden:z.boolean().default(false),text:z.string().max(120).refine(v=>!/[<>]/.test(v),"Use plain text.").default(""),visual:footerVisual.optional()}).strict();
export const hoverStyles=["NONE","SOFT_LIFT","GLOW","BORDER","BRIGHTEN","SCALE","SHADOW","SLIDE_ACCENT","GLASS_SHINE","DEPTH"] as const;
export const profileDesign = z.object({
  customThemeId:z.string().cuid().optional(),
  visual: profileVisual.optional(),
  hoverStyle:z.enum(hoverStyles).optional(),
  accentEnabled:z.boolean().optional(),
  surfaceColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  backgroundPreset: z.enum(["CUSTOM","DIFFUSION","AURORA","PEARL","DUSK","MESH","MIDNIGHT"]).optional(),
  iconSet: z.enum(["FEATHER","IONIC","BOOTSTRAP","MATERIAL","REMIX","HERO","ANT","CSSGG","GROMMET","OCTICONS"]).optional(),
  iconColor: z.enum(["THEME","MONOCHROME","BRAND"]).optional(),
  cardSize: z.enum(["SMALL","MEDIUM","LARGE"]).optional(),
  footer: footerConfig.optional(),
  theme: z.enum(["CLASSIC", "LIQUID_GLASS", "DIMENSIONAL"]).default("CLASSIC"),
  iconStyle: z.enum(["OUTLINE", "FILLED", "ROUNDED", "MINIMAL"]).default("OUTLINE"),
  radius: z.enum(["DEFAULT", "SQUARE", "SOFT", "ROUNDED", "PILL"]).default("DEFAULT"),
  density: z.enum(["COMPACT", "COMFORTABLE", "SPACIOUS"]).default("COMFORTABLE"),
  surface: z.enum(["MINIMAL", "SOFT", "ELEVATED", "GLASS"]).default("SOFT"),
}).strict();
export type ProfileDesign = z.infer<typeof profileDesign>;
/** Populate only when editing an older design; reading it never rewrites storage. */
export function editableVisual(design: ProfileDesign): ProfileVisual {
  if (design.visual) return design.visual;
  return {version:1,canvas:{background:"EXISTING",maxWidth:680,gap:{COMPACT:12,COMFORTABLE:20,SPACIOUS:28}[design.density]},
    hero:{composition:"COVER_OVERLAP"},
    surface:{variant:design.surface==="MINIMAL"?"TRANSPARENT":design.surface==="SOFT"?"SOFT":design.surface,color:design.surfaceColor??undefined,radius:{DEFAULT:16,SQUARE:0,SOFT:8,ROUNDED:24,PILL:48}[design.radius]},
    action:{minHeight:{SMALL:48,MEDIUM:60,LARGE:72}[design.cardSize??"MEDIUM"]}};
}
export function resolveProfileDesign(value: unknown, theme = "CLASSIC"): ProfileDesign {
  const parsed = profileDesign.safeParse(value);
  if(parsed.success)return parsed.data;
  // Unknown future visual versions must not erase otherwise valid saved legacy settings.
  if(value&&typeof value==="object"&&!Array.isArray(value)&&"visual" in value){
    const legacy={...value};delete legacy.visual;
    const fallback=profileDesign.safeParse(legacy);if(fallback.success)return fallback.data;
  }
  return profileDesign.parse({ theme: theme === "LIQUID_GLASS" ? theme : "CLASSIC" });
}
export function surfaceAttributes(value: unknown, fallback = "INHERIT") {
  const parsed = surfaceConfig.safeParse(value);
  const c = parsed.success ? parsed.data : undefined;
  return { "data-surface": c?.preset ?? fallback, "data-border": c?.border,
    "data-background": c?.background, "data-padding": c?.padding, "data-shadow": c?.shadow };
}
/** Reconcile only the submitted design scope; unrelated drafts remain unpublished. */
export function reconcileDesign(current:ProfileDesign|undefined,before:ProfileDesign|undefined,submitted:ProfileDesign|undefined,persisted:ProfileDesign|undefined,op:string):ProfileDesign|undefined {
  if(!current||!persisted)return persisted;
  return {...persisted,...Object.fromEntries(Object.entries(current).filter(([key,value])=>{
    const scope=(op==="footer"&&key==="footer")||(op==="design"&&key!=="footer");
    const baseline=scope?submitted:before;
    return JSON.stringify(value)!==JSON.stringify(baseline?.[key as keyof ProfileDesign]);
  }))};
}
