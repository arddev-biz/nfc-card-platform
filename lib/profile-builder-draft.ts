import { z } from "zod";
import { profileDesign } from "./profile-design";
import { linkPresentation, sectionData, itemData, imageData, parseSectionConfig, itemConfigs } from "./profile-v2";
import { profileLinkInputSchema } from "./validation/profile-links";
import { builderMenuDraftSchema } from "./profile-builder-menu";

const id = z.string().min(1).max(100);
export const builderDraftSchema = z.object({
  revision: z.number().int().nonnegative(),
  businessType: z.string().trim().max(100).optional(),
  profile: z.object({
    displayName: z.string().trim().min(1).max(120),
    bio: z.string().max(2000),
    phone: z.string().max(30), email: z.string().max(200),
    whatsapp: z.string().max(30), website: z.string().max(1000),
    address: z.string().max(300), googleMapsUrl: z.string().max(1000),
    themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
    logoUrl: z.string().url().max(2000).nullable(),
    coverImageUrl: z.string().url().max(2000).nullable(),
    backgroundImageUrl: z.string().url().max(2000).nullable().optional(),
  }).strict(),
  design: profileDesign,
  menu: builderMenuDraftSchema,
  sections: z.array(sectionData.extend({
    id, kind: z.string(), singletonKey: z.string().nullable(),
    items: z.array(itemData.extend({ id, images: z.array(imageData.extend({ id })).max(100) })).max(100),
  })).max(30),
  links: z.array(profileLinkInputSchema.innerType().extend({
    id, value: z.string().max(500), presentation: linkPresentation,
  })).max(200),
}).strict();
export type BuilderSaveDraft = z.infer<typeof builderDraftSchema>;

/** Same validators as Save, with field context; unchanged legacy links remain valid. */
export function builderDraftErrors(draft:BuilderSaveDraft,previousLinks:{id:string;type:string;url:string}[]):string[] {
  const errors:string[]=[];
  const report=(context:string,result:{success:boolean;error?:z.ZodError})=>{if(!result.success&&result.error)for(const issue of result.error.issues)errors.push(`${context}${issue.path.length?` · ${issue.path.join(" / ")}`:""}: ${issue.message}`);};
  report("Profile",builderDraftSchema.safeParse(draft));
  for(const section of draft.sections){
    const name=section.singletonKey==="BUSINESS_INFO"?"Contact":section.internalName;
    try{parseSectionConfig(section.singletonKey,section.config);}catch(error){if(error instanceof z.ZodError)report(name,{success:false,error});else throw error;}
    section.items.forEach((item,index)=>{const schema=itemConfigs[item.kind as keyof typeof itemConfigs];if(schema)report(`${name} · Item ${index+1}`,schema.safeParse(item.config));});
  }
  for(const link of draft.links){const old=previousLinks.find(l=>l.id===link.id);if(!old||old.type!==link.type||old.url!==link.value)report(`Link “${link.label||link.presentation.socialNetwork||link.type}”`,profileLinkInputSchema.safeParse(link));}
  return [...new Set(errors)];
}
