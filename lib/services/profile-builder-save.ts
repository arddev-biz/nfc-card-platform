import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getDefaultLabel } from "@/lib/linkTypes";
import { profileLinkInputSchema } from "@/lib/validation/profile-links";
import { profileDesign } from "@/lib/profile-design";
import { parseSectionConfig, itemConfigs } from "@/lib/profile-v2";
import { builderDraftSchema, type BuilderSaveDraft } from "@/lib/profile-builder-draft";
import { menuToBuilderDraft } from "@/lib/profile-builder-menu";
import { toV2Data, V2Error } from "./profile-v2";

/** A whole-draft write under one profile lock. Existing rows retain their IDs. */
export async function saveBuilderDraft(organizationId: string, input: BuilderSaveDraft) {
  const draft = builderDraftSchema.parse(input);
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "BusinessProfile" WHERE "organizationId" = ${organizationId} FOR UPDATE`;
    const profile = await tx.businessProfile.findUnique({where:{organizationId},include:{sections:{include:{items:{include:{images:true}}}},links:true}});
    if (!profile || profile.builderVersion !== 2) throw new V2Error("This builder requires an upgraded profile.");
    if (profile.layoutRevision !== draft.revision) throw new V2Error("This profile changed elsewhere. Reload before saving.");
    const existingSections = new Map(profile.sections.map(s=>[s.id,s]));
    const existingLinks = new Map(profile.links.map(l=>[l.id,l]));
    const sectionIds = new Set(draft.sections.map(s=>s.id));
    const linkIds = new Set(draft.links.map(l=>l.id));
    if (sectionIds.size !== draft.sections.length || linkIds.size !== draft.links.length) throw new V2Error("Duplicate content in draft.");
    for (const old of profile.sections) if (old.kind === "CORE" && !sectionIds.has(old.id)) throw new V2Error("Core sections cannot be removed.");
    const socials = draft.sections.filter(s=>s.kind==="SOCIALS");
    if (socials.length>1) throw new V2Error("Only one Socials section is supported.");
    const idMap = new Map<string,string>();
    for (const [position,s] of draft.sections.entries()) {
      const old = existingSections.get(s.id);
      if (old && (old.kind !== s.kind || old.singletonKey !== s.singletonKey)) throw new V2Error("Section type changed unexpectedly.");
      if (!old && !s.id.startsWith("new-")) throw new V2Error("Unknown section.");
      if (!old && !["SOCIALS","CUSTOM"].includes(s.kind)) throw new V2Error("Unsupported section type.");
      const config = parseSectionConfig(s.singletonKey,s.config) as Prisma.InputJsonObject;
      const values = {internalName:s.internalName,visibleTitle:s.visibleTitle,isVisible:s.isVisible,position,config};
      if (old) { await tx.profileSection.update({where:{id:old.id},data:values}); idMap.set(s.id,old.id); }
      else {
        const created=await tx.profileSection.create({data:{businessProfileId:profile.id,kind:s.kind,singletonKey:s.kind==="SOCIALS"?"SOCIALS":null,...values}});
        idMap.set(s.id,created.id);
      }
    }
    for (const [sortOrder,l] of draft.links.entries()) {
      const old=existingLinks.get(l.id);
      if(!old||old.type!==l.type||old.url!==l.value)profileLinkInputSchema.parse({type:l.type,label:l.label,value:l.value,isActive:l.isActive});
      if (!old && !l.id.startsWith("new-")) throw new V2Error("Unknown link.");
      const socialSectionId=l.presentation.socialSectionId ? idMap.get(l.presentation.socialSectionId) : null;
      if(l.presentation.socialSectionId&&!socialSectionId)throw new V2Error("Social section not found.");
      const values={type:l.type,label:l.label||getDefaultLabel(l.type),url:l.value,isActive:l.isActive??true,sortOrder,
        width:l.presentation.width,iconMode:l.presentation.iconMode,v2IsVisible:l.presentation.v2IsVisible,
        customIconAssetId:l.presentation.customIconAssetId,socialSectionId,socialNetwork:l.presentation.socialNetwork};
      if (old) await tx.profileLink.update({where:{id:old.id},data:values});
      else await tx.profileLink.create({data:{businessProfileId:profile.id,...values}});
    }
    for (const old of profile.links) if (!linkIds.has(old.id)) {
      await tx.profileSectionItem.updateMany({where:{businessProfileId:profile.id,referencedProfileLinkId:old.id},data:{referencedProfileLinkId:null,isVisible:false}});
      await tx.profileLink.delete({where:{id:old.id}});
    }
    for (const s of draft.sections) {
      const sectionId=idMap.get(s.id)!;
      const old=existingSections.get(s.id);
      const oldItems=new Map(old?.items.map(i=>[i.id,i])??[]);
      for (const [position,i] of s.items.entries()) {
        const prior=oldItems.get(i.id);
        if (!prior && !i.id.startsWith("new-")) throw new V2Error("Unknown item.");
        if (prior && prior.kind!==i.kind) throw new V2Error("Item type changed unexpectedly.");
        const config=itemConfigs[i.kind as keyof typeof itemConfigs]?.parse(i.config) as Prisma.InputJsonObject | undefined;
        if(!config)throw new V2Error("Unsupported item type.");
        const values={kind:i.kind,position,width:i.width,isVisible:i.isVisible,config,referencedProfileLinkId:i.referencedProfileLinkId};
        const savedItem=prior
          ?await tx.profileSectionItem.update({where:{id:prior.id},data:values})
          :await tx.profileSectionItem.create({data:{businessProfileId:profile.id,sectionId,...values}});
        const oldImages=new Map(prior?.images.map(image=>[image.id,image])??[]);
        const imageIds=new Set<string>();
        for(const [imagePosition,image] of i.images.entries()){
          if(imageIds.has(image.id))throw new V2Error("Duplicate image in draft.");
          imageIds.add(image.id);
          const oldImage=oldImages.get(image.id);
          if(!oldImage&&!image.id.startsWith("new-"))throw new V2Error("Unknown image.");
          const asset=await tx.profileAsset.findFirst({where:{id:image.assetId,businessProfileId:profile.id},select:{id:true}});
          if(!asset)throw new V2Error("Choose an image uploaded for this profile.");
          const imageValues={assetId:image.assetId,position:imagePosition,alt:image.alt,caption:image.caption,destinationUrl:image.destinationUrl};
          if(oldImage)await tx.profileItemImage.update({where:{id:oldImage.id},data:imageValues});
          else await tx.profileItemImage.create({data:{businessProfileId:profile.id,itemId:savedItem.id,...imageValues}});
        }
        for(const image of oldImages.values())if(!imageIds.has(image.id))await tx.profileItemImage.delete({where:{id:image.id}});
      }
      for(const prior of old?.items??[])if(!s.items.some(i=>i.id===prior.id))await tx.profileSectionItem.delete({where:{id:prior.id}});
    }
    for(const old of profile.sections)if(!sectionIds.has(old.id)){
      await tx.profileLink.updateMany({where:{businessProfileId:profile.id,socialSectionId:old.id},data:{socialSectionId:null,v2IsVisible:false}});
      await tx.profileSection.delete({where:{id:old.id}});
    }
    if (draft.menu) {
      const oldMenu=await tx.menu.findUnique({where:{organizationId},include:{categories:{include:{items:true}}}});
      if(oldMenu&&oldMenu.id!==draft.menu.id)throw new V2Error("Menu changed elsewhere. Reload before saving.");
      if(!oldMenu&&!draft.menu.id.startsWith("new-"))throw new V2Error("Menu changed elsewhere. Reload before saving.");
      const menu=oldMenu
        ?await tx.menu.update({where:{id:oldMenu.id},data:{name:draft.menu.name,description:draft.menu.description||null,isActive:draft.menu.isActive}})
        :await tx.menu.create({data:{organizationId,name:draft.menu.name,description:draft.menu.description||null,isActive:draft.menu.isActive}});
      const oldCategories=new Map(oldMenu?.categories.map(c=>[c.id,c])??[]);
      const oldItems=new Map(oldMenu?.categories.flatMap(c=>c.items.map(i=>[i.id,i] as const))??[]);
      const categoryIds=new Set<string>(),itemIds=new Set<string>();
      for(const [sortOrder,category] of draft.menu.categories.entries()){
        if(categoryIds.has(category.id))throw new V2Error("Duplicate menu category.");
        categoryIds.add(category.id);
        const prior=oldCategories.get(category.id);
        if(!prior&&!category.id.startsWith("new-"))throw new V2Error("Unknown menu category.");
        const values={name:category.name,description:category.description||null,isActive:category.isActive,sortOrder};
        const savedCategory=prior
          ?await tx.menuCategory.update({where:{id:prior.id},data:values})
          :await tx.menuCategory.create({data:{menuId:menu.id,...values}});
        for(const [itemOrder,item] of category.items.entries()){
          if(itemIds.has(item.id))throw new V2Error("Duplicate menu item.");
          itemIds.add(item.id);
          const old=oldItems.get(item.id);
          if(!old&&!item.id.startsWith("new-"))throw new V2Error("Unknown menu item.");
          const itemValues={categoryId:savedCategory.id,name:item.name,description:item.description||null,priceMinor:item.priceMinor,currency:item.currency,isActive:item.isActive,sortOrder:itemOrder};
          if(old)await tx.menuItem.update({where:{id:old.id},data:itemValues});
          else await tx.menuItem.create({data:itemValues});
        }
      }
      for(const old of oldItems.values())if(!itemIds.has(old.id))await tx.menuItem.delete({where:{id:old.id}});
      for(const old of oldCategories.values())if(!categoryIds.has(old.id))await tx.menuCategory.delete({where:{id:old.id}});
    }
    if(draft.businessType!==undefined)await tx.organization.update({where:{id:organizationId},data:{businessType:draft.businessType||null}});
    const design=profileDesign.parse(draft.design);
    for(const key of ["logoUrl","coverImageUrl","backgroundImageUrl"] as const){
      const url=draft.profile[key];
      if(url&&url!==profile[key]){
        const owned=await tx.profileAsset.findFirst({where:{businessProfileId:profile.id,url},select:{id:true}});
        if(!owned)throw new V2Error("Choose an image uploaded for this profile.");
      }
    }
    await tx.businessProfile.update({where:{id:profile.id},data:{
      displayName:draft.profile.displayName,bio:draft.profile.bio||null,phone:draft.profile.phone||null,email:draft.profile.email||null,
      whatsapp:draft.profile.whatsapp||null,website:draft.profile.website||null,address:draft.profile.address||null,
      googleMapsUrl:draft.profile.googleMapsUrl||null,themeColor:draft.profile.themeColor,
      logoUrl:draft.profile.logoUrl,coverImageUrl:draft.profile.coverImageUrl,
      ...(draft.profile.backgroundImageUrl!==undefined?{backgroundImageUrl:draft.profile.backgroundImageUrl}:{}),
      designConfig:design,theme:design.theme,layoutRevision:{increment:1},
    }});
    const saved=await tx.businessProfile.findUnique({where:{id:profile.id},include:{
      sections:{orderBy:[{position:"asc" as const},{id:"asc" as const}],include:{items:{orderBy:[{position:"asc" as const},{id:"asc" as const}],include:{images:{orderBy:[{position:"asc" as const},{id:"asc" as const}],include:{asset:true}}}}}},
      links:{orderBy:[{sortOrder:"asc" as const},{id:"asc" as const}],include:{customIconAsset:true}},
    }});
    if(!saved)throw new V2Error("Saved profile could not be read.");
    const savedMenu=await tx.menu.findUnique({where:{organizationId},include:{categories:{include:{items:true}}}});
    return {v2:toV2Data(saved),menu:menuToBuilderDraft(savedMenu)};
  },{timeout:30000});
}
