import {z} from "zod";
import {profileDesign,editableVisual,surfaceConfig,type ProfileDesign} from "./profile-design";
import {profileVisual,heroDesign,footerVisual,visualOverride} from "./profile-visual";
import {socialConfig,type V2Section} from "./profile-v2";
import {applyProfilePreset} from "./profile-presets";

// Explicit global-only allowlist: never accept a whole business/profile draft.
const reusableVisual=profileVisual.pick({version:true,canvas:true,surface:true,action:true,typography:true,primaryAction:true,socials:true}).extend({
  hero:heroDesign.pick({composition:true,height:true,mobileHeight:true,fit:true,focalX:true,focalY:true,overlayColor:true,overlayOpacity:true,fade:true,avatarBackground:true,avatarSize:true,avatarRadius:true,avatarBorder:true,avatarBorderColor:true,avatarShadow:true,overlap:true,align:true,padding:true,paddingBottom:true,gap:true,identityPosition:true,textOrder:true,curvedEdge:true,minHeight:true}).optional(),
}).strict();
const reusableSettings=profileDesign.pick({hoverStyle:true,accentEnabled:true,surfaceColor:true,backgroundPreset:true,iconSet:true,iconColor:true,cardSize:true,theme:true,iconStyle:true,radius:true,density:true,surface:true}).strict();
export const themeSnapshotSchema=z.object({
  settings:reusableSettings,
  visual:reusableVisual,
  accentColor:z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
  footerVisual:footerVisual.optional(),
  sectionAppearance:z.object({
    LINKS:z.object({visual:visualOverride.optional(),surface:surfaceConfig.optional()}).strict().optional(),
    SOCIALS:socialConfig.pick({visual:true,surface:true,composition:true,containerStyle:true,shape:true,containerColor:true,border:true,borderColor:true,iconColor:true,spacing:true,align:true,iconSize:true,labels:true}).partial().strict().optional(),
  }).strict().optional(),
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
export function snapshotCurrentDesign(design:ProfileDesign,accentColor:string|null,sections?:Pick<V2Section,"singletonKey"|"config">[]):ThemeSnapshot {
  const {visual,footer,customThemeId,...settings}=profileDesign.parse(design);
  const {hero,badge,...safeVisual}=editableVisual(design);
  const {tagline,description,showBusinessType,...safeHero}=hero??{};
  const sectionAppearance:Record<string,unknown>={};
  for(const key of ["LINKS","SOCIALS"] as const){
    const section=sections?.find(s=>s.singletonKey===key);if(!section)continue;
    const allowed=key==="LINKS"?["visual","surface"]:["visual","surface","composition","containerStyle","shape","containerColor","border","borderColor","iconColor","spacing","align","iconSize","labels"];
    const config:Record<string,unknown>=key==="SOCIALS"?socialConfig.parse(section.config):section.config;
    const appearance=Object.fromEntries(allowed.filter(k=>config[k]!==undefined).map(k=>[k,config[k]]));
    if(Object.keys(appearance).length)sectionAppearance[key]=appearance;
  }
  return themeSnapshotSchema.parse({settings,visual:{...safeVisual,hero:safeHero},accentColor,...(footer?.visual?{footerVisual:footer.visual}:{}),...(Object.keys(sectionAppearance).length?{sectionAppearance}:{})});
}
const sectionStyleKeys=["visual","surface"];
const socialStyleKeys=[...sectionStyleKeys,"composition","containerStyle","shape","containerColor","border","borderColor","iconColor","spacing","align","iconSize","labels"];
export function appearanceSignature(value:unknown):string {
 const normalize=(value:unknown):unknown=>{
  if(Array.isArray(value))return value.map(normalize);
  if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).flatMap(([key,v])=>{const next=normalize(v);return next===undefined||next&&typeof next==="object"&&!Array.isArray(next)&&!Object.keys(next).length?[]:[[key,next]]}));
  return value;
 };
 return JSON.stringify(normalize(value));
}
export function sectionHasStyleOverride(section:V2Section,theme?:ThemeSnapshot){
 const key=section.singletonKey;
 const recipe=key==="LINKS"||key==="SOCIALS"?theme?.sectionAppearance?.[key]:undefined;
 const extract=(config:Record<string,unknown>)=>{
  const parsed:Record<string,unknown>=section.kind==="SOCIALS"?socialConfig.parse(config):config;
  const keys=section.kind==="SOCIALS"?socialStyleKeys:sectionStyleKeys;
  return appearanceSignature(Object.fromEntries(keys.filter(k=>parsed[k]!==undefined).map(k=>[k,parsed[k]])));
 };
 return extract(section.config)!==extract(recipe??{});
}
export function inheritedSectionConfig(section:V2Section,theme?:ThemeSnapshot){
 const config={...section.config};for(const key of section.kind==="SOCIALS"?socialStyleKeys:sectionStyleKeys)delete config[key];
 const key=section.singletonKey;if(key==="LINKS"||key==="SOCIALS")Object.assign(config,theme?.sectionAppearance?.[key]??{});
 return config;
}
/** Apply replaces section appearance. Rare item styles are retained only for Apply. */
export function applyThemeSections(sections:V2Section[],value:unknown,resetItems=false):V2Section[]{
 const snapshot=themeSnapshotSchema.parse(value);
 return sections.map(section=>{
  const key=section.singletonKey;
  const config={...section.config};
  for(const field of section.kind==="SOCIALS"?socialStyleKeys:sectionStyleKeys)delete config[field];
  if(key==="LINKS"||key==="SOCIALS")Object.assign(config,snapshot.sectionAppearance?.[key]??{});
  if(resetItems&&config.linkStyles){config.linkStyles=Object.fromEntries(Object.entries(config.linkStyles as Record<string,{subtitle?:string}>).filter(([,style])=>style.subtitle!==undefined).map(([id,style])=>[id,{subtitle:style.subtitle}]));}
  return {...section,config,items:resetItems?section.items.map(item=>{const itemConfig={...item.config};delete itemConfig.visual;delete itemConfig.surface;return {...item,config:itemConfig}}):section.items};
 });
}
export function applyCustomTheme(current:ProfileDesign,value:unknown):ProfileDesign {
  const snapshot=themeSnapshotSchema.parse(value);
  const next=applyProfilePreset({...profileDesign.parse(snapshot.settings),footer:current.footer,customThemeId:current.customThemeId,visual:current.visual},snapshot.visual);
  next.visual={...next.visual!,badge:current.visual?.badge};
  next.footer={hidden:current.footer?.hidden??false,text:current.footer?.text??"",visual:snapshot.footerVisual??{decoration:"NONE",layout:{before:0,padding:0},surface:{variant:"TRANSPARENT"}}};
  return next;
}
export function readCustomTheme(value:unknown):CustomTheme {
  const record=z.object({id:z.string().cuid(),name:plainName,description:createCustomThemeSchema.shape.description.unwrap().nullable(),design:themeSnapshotSchema}).parse(value);
  return record;
}
