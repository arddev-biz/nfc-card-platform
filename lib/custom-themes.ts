import {z} from "zod";
import {profileDesign,editableVisual,type ProfileDesign} from "./profile-design";
import {profileVisual,heroDesign} from "./profile-visual";
import {applyProfilePreset} from "./profile-presets";

// Explicit global-only allowlist: never accept a whole business/profile draft.
const reusableVisual=profileVisual.pick({version:true,canvas:true,surface:true,action:true,typography:true,primaryAction:true,socials:true}).extend({
  hero:heroDesign.pick({composition:true,height:true,mobileHeight:true,fit:true,focalX:true,focalY:true,overlayColor:true,overlayOpacity:true,avatarSize:true,avatarRadius:true,avatarBorder:true,avatarBorderColor:true,avatarShadow:true,overlap:true,align:true,padding:true,paddingBottom:true,gap:true,identityPosition:true,textOrder:true,curvedEdge:true,minHeight:true}).optional(),
}).strict();
const reusableSettings=profileDesign.pick({hoverStyle:true,accentEnabled:true,surfaceColor:true,backgroundPreset:true,iconSet:true,iconColor:true,cardSize:true,theme:true,iconStyle:true,radius:true,density:true,surface:true}).strict();
export const themeSnapshotSchema=z.object({
  settings:reusableSettings,
  visual:reusableVisual,
  accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
}).strict().refine(d=>!!d.visual.canvas?.background&&(d.visual.canvas.background!=="EXISTING"||
  (!!d.settings.backgroundPreset&&d.settings.backgroundPreset!=="CUSTOM")),
  "Choose a Solid, Gradient or Photo background before saving this theme.");
const plainName=z.string().trim().min(1).max(80).refine(v=>!/[<>\x00-\x1f]/.test(v),"Use a plain-text name.");
export const createCustomThemeSchema=z.object({name:plainName,
  description:z.string().trim().max(200).refine(v=>!/[<>\x00-\x1f]/.test(v),"Use plain text.").optional(),
  design:themeSnapshotSchema}).strict();
export type ThemeSnapshot=z.infer<typeof themeSnapshotSchema>;
export const updateCustomThemeSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("METADATA"),...createCustomThemeSchema.pick({name:true,description:true}).shape}).strict(),
 z.object({action:z.literal("DESIGN"),design:themeSnapshotSchema}).strict(),
]);
export type CustomTheme={id:string;name:string;description:string|null;design:ThemeSnapshot};
export const themeNameKey=(name:string)=>name.normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
export function snapshotCurrentDesign(design:ProfileDesign,accentColor:string|null):ThemeSnapshot {
  const {visual,footer,customThemeId,...settings}=profileDesign.parse(design);
  const {hero,badge,...safeVisual}=editableVisual(design);
  const {tagline,description,showBusinessType,...safeHero}=hero??{};
  return themeSnapshotSchema.parse({settings,visual:{...safeVisual,hero:safeHero},accentColor});
}
export function applyCustomTheme(current:ProfileDesign,value:unknown):ProfileDesign {
  const snapshot=themeSnapshotSchema.parse(value);
  const next=applyProfilePreset({...profileDesign.parse(snapshot.settings),footer:current.footer,customThemeId:current.customThemeId,visual:current.visual},snapshot.visual);
  next.visual={...next.visual!,badge:current.visual?.badge};
  return next;
}
export function readCustomTheme(value:unknown):CustomTheme {
  const record=z.object({id:z.string().cuid(),name:plainName,description:createCustomThemeSchema.shape.description.unwrap().nullable(),design:themeSnapshotSchema}).parse(value);
  return record;
}
