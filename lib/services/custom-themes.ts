import {db} from "@/lib/db";
import {Prisma} from "@prisma/client";
import {createCustomThemeSchema,updateCustomThemeSchema,themeNameKey,readCustomTheme,snapshotCurrentDesign} from "@/lib/custom-themes";
import {profilePresets} from "@/lib/profile-presets";
import {profileDesign} from "@/lib/profile-design";
import {starterThemeLibrary} from "@/lib/starter-theme-library";
import {z} from "zod";
export async function listCustomThemes(){
  const rows=await db.customTheme.findMany({orderBy:[{createdAt:"desc"},{id:"asc"}]});
  // Invalid stored payloads never enter the picker or renderer.
  return rows.flatMap(row=>{try{return [readCustomTheme(row)]}catch{return []}});
}
/** Explicit one-time operation, never called by reads: deleted themes stay deleted. */
export async function materializeStarterThemes(){
 const entries=starterThemeLibrary.map(entry=>{
  const preset=profilePresets.find(p=>p.name===entry.name)!;
  const value=createCustomThemeSchema.parse({name:entry.name,design:snapshotCurrentDesign(profileDesign.parse({visual:preset.visual}),null)});
  return {...entry,nameKey:themeNameKey(value.name),description:null,design:value.design as Prisma.InputJsonValue};
 });
 return db.$transaction(async tx=>{
  const existing=await tx.customTheme.findMany({where:{OR:[{id:{in:entries.map(e=>e.id)}},{nameKey:{in:entries.map(e=>e.nameKey)}}]}});
  for(const entry of entries){const collision=existing.find(row=>row.nameKey===entry.nameKey&&row.id!==entry.id);if(collision)throw new Error(`A library theme already uses “${entry.name}”. No starter themes were added; resolve that name conflict first.`)}
  // Existing IDs (including renamed or customized entries) are never overwritten.
  return tx.customTheme.createMany({data:entries.filter(entry=>!existing.some(row=>row.id===entry.id)),skipDuplicates:true});
 });
}
export async function createCustomTheme(input:unknown){
  const data=createCustomThemeSchema.parse(input);
  const row=await db.customTheme.create({data:{name:data.name,nameKey:themeNameKey(data.name),
    description:data.description||null,design:data.design as Prisma.InputJsonValue}});
  return readCustomTheme(row);
}
export async function updateCustomTheme(id:string,input:unknown){
 z.string().cuid().parse(id);
 const value=updateCustomThemeSchema.parse(input);
 const data=value.action==="METADATA"?{name:value.name,nameKey:themeNameKey(value.name),description:value.description||null}:{design:value.design as Prisma.InputJsonValue};
 return readCustomTheme(await db.customTheme.update({where:{id},data}));
}
export async function deleteCustomTheme(id:string){
 z.string().cuid().parse(id);
 await db.customTheme.delete({where:{id}});
}
