import { z } from "zod";

export const surfaceConfig = z.object({
  preset: z.enum(["INHERIT", "NONE", "MINIMAL", "CARD"]).default("INHERIT"),
  border: z.boolean().optional(), background: z.boolean().optional(),
  padding: z.boolean().optional(), shadow: z.boolean().optional(),
}).strict();
export const surfaceFields = { surface: surfaceConfig.optional() };
export const footerConfig = z.object({hidden:z.boolean().default(false),text:z.string().max(120).refine(v=>!/[<>]/.test(v),"Use plain text.").default("")}).strict();
export const hoverStyles=["NONE","SOFT_LIFT","GLOW","BORDER","BRIGHTEN","SCALE","SHADOW","SLIDE_ACCENT","GLASS_SHINE","DEPTH"] as const;
export const profileDesign = z.object({
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
export function resolveProfileDesign(value: unknown, theme = "CLASSIC"): ProfileDesign {
  const parsed = profileDesign.safeParse(value);
  return parsed.success ? parsed.data : profileDesign.parse({ theme: theme === "LIQUID_GLASS" ? theme : "CLASSIC" });
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
