import "server-only";
import {hasPremiumBranding,brandingCapabilities} from "@/lib/branding";
import { profileDesign, resolveProfileDesign } from "@/lib/profile-design";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { assertExactOrder, coreKeys, infoConfig, itemConfigs, parseSectionConfig, type V2Data, type V2Command } from "@/lib/profile-v2";
import { profileLinkInputSchema } from "@/lib/validation/profile-links";
import { getDefaultLabel } from "@/lib/linkTypes";

const graph = {
  sections: { orderBy: [{ position: "asc" as const }, { id: "asc" as const }], include: {
    items: { orderBy: [{ position: "asc" as const }, { id: "asc" as const }], include: {
      images: { orderBy: [{ position: "asc" as const }, { id: "asc" as const }], include: { asset: true } },
    } },
  } },
  links: { orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }], include: { customIconAsset: true } },
};
type Graph = Prisma.BusinessProfileGetPayload<{ include: typeof graph }>;
const object = (v: Prisma.JsonValue): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v : {};
export function toV2Data(p: Graph): V2Data {
  return { version: p.builderVersion, revision: p.layoutRevision, theme: resolveProfileDesign(p.designConfig, p.theme).theme, design: resolveProfileDesign(p.designConfig, p.theme),
    sections: p.sections.map(s => ({ id: s.id, kind: s.kind, singletonKey: s.singletonKey,
      internalName: s.internalName, visibleTitle: s.visibleTitle, position: s.position,
      isVisible: s.isVisible, config: object(s.config),
      items: s.items.map(i => ({ id: i.id, kind: i.kind, position: i.position, width: i.width,
        isVisible: i.isVisible, config: object(i.config), referencedProfileLinkId: i.referencedProfileLinkId,
        images: i.images.map(m => ({ id: m.id, assetId: m.assetId, url: m.asset.url, position: m.position,
          alt: m.alt, caption: m.caption, destinationUrl: m.destinationUrl })) })) })),
    links: p.links.map(l => ({ id: l.id, type: l.type, label: l.label, url: l.url, isActive: l.isActive,
      width: l.width, iconMode: l.iconMode, v2IsVisible: l.v2IsVisible, customIconAssetId: l.customIconAssetId,
      iconUrl: l.customIconAsset?.url ?? null, socialSectionId: l.socialSectionId, socialNetwork: l.socialNetwork })),
  };
}
export async function getV2Data(organizationId: string) {
  const p = await db.businessProfile.findUnique({ where: { organizationId }, include: graph });
  return p ? toV2Data(p) : null;
}
export function initialV2Sections() {
  return coreKeys.map((key, position) => ({
    kind: "CORE", singletonKey: key, internalName: { BIO: "Bio", BUSINESS_INFO: "Business Info", LINKS: "Links", MENU: "Digital Menu" }[key],
    position, isVisible: true,
    config: key === "BUSINESS_INFO"
      ? infoConfig.parse({ phone: true, whatsapp: true, email: true, website: true, address: true, maps: true })
      : parseSectionConfig(key, {}),
  }));
}
export class V2Error extends Error {}
function requireValue<T>(v: T | null | undefined, message = "Record not found."): T {
  if (v === null || v === undefined) throw new V2Error(message);
  return v;
}
const singletonTypes = ["PHONE", "WHATSAPP", "GOOGLE_MAPS", "GOOGLE_REVIEWS"];
const appendPosition = (rows: { position: number }[]) => Math.max(-1, ...rows.map(r => r.position)) + 1;

export async function mutateV2(organizationId: string, revision: number, command: V2Command, actorRole: "SUPER_ADMIN"|"BUSINESS_OWNER" = "BUSINESS_OWNER") {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "BusinessProfile" WHERE "organizationId" = ${organizationId} FOR UPDATE`;
    const p = requireValue(await tx.businessProfile.findUnique({ where: { organizationId }, include: graph }));
    if (p.builderVersion !== 2) throw new V2Error("Explicit upgrade required.");
    if (p.layoutRevision !== revision) throw new V2Error("This profile changed. Reload before saving.");
    const owner = { businessProfileId: p.id };
    const section = (id: string) => requireValue(p.sections.find(s => s.id === id));
    const item = (id: string) => requireValue(p.sections.flatMap(s => s.items).find(i => i.id === id));
    const link = (id: string) => requireValue(p.links.find(l => l.id === id));
    const image = (id: string) => requireValue(p.sections.flatMap(s => s.items.flatMap(i => i.images)).find(m => m.id === id));
    async function asset(id: string) { return requireValue(await tx.profileAsset.findFirst({ where: { id, ...owner } })); }
    async function presentation(data: Extract<V2Command, { op: "link-presentation" }>["data"]) {
      if (data.customIconAssetId) await asset(data.customIconAssetId);
      if (data.socialSectionId && section(data.socialSectionId).kind !== "SOCIALS") throw new V2Error("Choose a Socials section.");
      return data;
    }
    function validItem(data: Extract<V2Command, { op: "item-create" }>["data"]) {
      if (data.referencedProfileLinkId) link(data.referencedProfileLinkId);
      return { ...data, config: itemConfigs[data.kind].parse(data.config) };
    }
    async function reorder(ids: string[], next: string[], update: (id: string, position: number) => Promise<unknown>) {
      assertExactOrder(ids, next);
      for (const [position, id] of next.entries()) await update(id, position);
    }
    switch (command.op) {
      case "section-create":
        if (p.sections.length >= 30) throw new V2Error("Maximum 30 sections.");
        if (command.kind === "SOCIALS" && p.sections.some(s => s.kind === "SOCIALS")) throw new V2Error("Socials already exists.");
        if (command.kind === "SOCIALS") await tx.profileSection.updateMany({ where: owner, data: { position: { increment: 1 } } });
        await tx.profileSection.create({ data: { ...owner, kind: command.kind, singletonKey: command.kind === "SOCIALS" ? "SOCIALS" : null,
          internalName: command.kind === "SOCIALS" ? "Socials" : "New section", position: command.kind === "SOCIALS" ? 0 : appendPosition(p.sections),
          isVisible: true, config: parseSectionConfig(command.kind === "SOCIALS" ? "SOCIALS" : null, {}) } });
        break;
      case "section-update": {
        const s = section(command.id);
        await tx.profileSection.update({ where: { id: s.id }, data: { ...command.data, config: parseSectionConfig(s.singletonKey, command.data.config) } });
        break;
      }
      case "section-delete": {
        const s = section(command.id);
        if (s.kind === "CORE") throw new V2Error("Core sections can be hidden, not deleted.");
        // Social links are retained, not unexpectedly published in ordinary Links.
        await tx.profileLink.updateMany({ where: { ...owner, socialSectionId: s.id }, data: { socialSectionId: null, v2IsVisible: false } });
        await tx.profileSection.delete({ where: { id: s.id } });
        break;
      }
      case "section-duplicate": {
        const s = section(command.id);
        if (s.kind !== "CUSTOM" || p.sections.length >= 30) throw new V2Error("Only Custom sections can be duplicated (maximum 30).");
        await tx.profileSection.create({ data: { ...owner, kind: "CUSTOM", internalName: (s.internalName + " copy").slice(0,100),
          visibleTitle: s.visibleTitle, isVisible: s.isVisible, position: appendPosition(p.sections), config: object(s.config) as Prisma.InputJsonObject,
          items: { create: s.items.map(i => ({ ...owner, kind: i.kind, position: i.position, width: i.width, isVisible: i.isVisible,
            config: object(i.config) as Prisma.InputJsonObject, referencedProfileLinkId: i.referencedProfileLinkId,
            images: { create: i.images.map(m => ({ ...owner, assetId: m.assetId, position: m.position, alt: m.alt, caption: m.caption, destinationUrl: m.destinationUrl })) } })) } } });
        break;
      }
      case "section-order":
        await reorder(p.sections.map(s => s.id), command.orderedIds, (id, position) => tx.profileSection.update({ where: { id }, data: { position } })); break;
      case "item-create": {
        const s = section(command.sectionId);
        if (s.kind !== "CUSTOM" || s.items.length >= 100) throw new V2Error("Choose Custom (maximum 100 items).");
        await tx.profileSectionItem.create({ data: { ...owner, sectionId: s.id, position: appendPosition(s.items), ...validItem(command.data) } }); break;
      }
      case "item-update": {
        const i = item(command.id);
        if (i.kind !== command.data.kind) throw new V2Error("Item kind cannot change.");
        await tx.profileSectionItem.update({ where: { id: i.id }, data: validItem(command.data) }); break;
      }
      case "item-delete": await tx.profileSectionItem.delete({ where: { id: item(command.id).id } }); break;
      case "item-duplicate": {
        const i = item(command.id), s = section(i.sectionId);
        if (s.items.length >= 100) throw new V2Error("Maximum 100 items.");
        await tx.profileSectionItem.create({ data: { ...owner, sectionId: s.id, kind: i.kind, position: appendPosition(s.items),
          isVisible: i.isVisible, width: i.width, config: object(i.config) as Prisma.InputJsonObject, referencedProfileLinkId: i.referencedProfileLinkId,
          images: { create: i.images.map(m => ({ ...owner, assetId: m.assetId, position: m.position, alt: m.alt, caption: m.caption, destinationUrl: m.destinationUrl })) } } }); break;
      }
      case "item-order": {
        const s = section(command.sectionId);
        await reorder(s.items.map(i => i.id), command.orderedIds, (id, position) => tx.profileSectionItem.update({ where: { id }, data: { position } })); break;
      }
      case "image-create": {
        const i = item(command.itemId);
        if (!["IMAGE", "CAROUSEL"].includes(i.kind) || i.images.length >= (i.kind === "IMAGE" ? 1 : 20)) throw new V2Error("Image limit reached.");
        await asset(command.data.assetId);
        await tx.profileItemImage.create({ data: { ...owner, itemId: i.id, position: appendPosition(i.images), ...command.data } }); break;
      }
      case "image-update":
        image(command.id); await asset(command.data.assetId);
        await tx.profileItemImage.update({ where: { id: command.id }, data: command.data }); break;
      case "image-delete": await tx.profileItemImage.delete({ where: { id: image(command.id).id } }); break;
      case "image-order": {
        const i = item(command.itemId);
        await reorder(i.images.map(m => m.id), command.orderedIds, (id, position) => tx.profileItemImage.update({ where: { id }, data: { position } })); break;
      }
      case "link-presentation": link(command.id);
        await tx.profileLink.update({ where: { id: command.id }, data: await presentation(command.data) }); break;
      case "link-save": {
        const existing = command.id ? link(command.id) : null;
        const data = profileLinkInputSchema.parse(command.data);
        if (singletonTypes.includes(data.type) && p.links.some(l => l.type === data.type && l.id !== existing?.id)) throw new V2Error("That singleton link already exists.");
        if (!existing && p.links.length >= 200) throw new V2Error("Maximum 200 links.");
        const values = { type: data.type, label: data.label || getDefaultLabel(data.type), url: data.value,
          isActive: data.isActive ?? true, ...await presentation(command.presentation) };
        if (existing) await tx.profileLink.update({ where: { id: existing.id }, data: values });
        else await tx.profileLink.create({ data: { ...owner, ...values, sortOrder: Math.max(-1, ...p.links.map(l => l.sortOrder)) + 1 } }); break;
      }
      case "link-delete": {
        link(command.id);
        // Keep custom actions but hide them when their referenced canonical link is removed.
        await tx.profileSectionItem.updateMany({ where: { ...owner, referencedProfileLinkId: command.id }, data: { referencedProfileLinkId: null, isVisible: false } });
        await tx.profileLink.delete({ where: { id: command.id } }); break;
      }
      case "link-order": {
        if (command.socialSectionId) section(command.socialSectionId);
        const scoped = p.links.filter(l => l.socialSectionId === command.socialSectionId);
        assertExactOrder(scoped.map(l => l.id), command.orderedIds);
        let n = 0;
        const full = p.links.map(l => l.socialSectionId === command.socialSectionId ? command.orderedIds[n++] : l.id);
        await reorder(p.links.map(l => l.id), full, (id, sortOrder) => tx.profileLink.update({ where: { id }, data: { sortOrder } })); break;
      }
      case "footer":
      case "design": {
        const previous=resolveProfileDesign(p.designConfig,p.theme);
        const design=profileDesign.parse(command.op==="footer"?{...previous,footer:command.data}:command.data);
        if(actorRole!=="SUPER_ADMIN" && JSON.stringify(design.footer)!==JSON.stringify(previous.footer)) {
          const subscription=await tx.subscription.findFirst({where:{organizationId},orderBy:[{createdAt:"desc"},{id:"desc"}]});
          if(!brandingCapabilities(actorRole,hasPremiumBranding(subscription)).customizeFooter)throw new V2Error("An active Premium subscription is required for custom footer branding.");
        }
        await tx.businessProfile.update({where:{id:p.id},data:{designConfig:design}});break;
      }
      case "theme": await tx.businessProfile.update({ where: { id: p.id }, data: { theme: command.theme, designConfig: { ...resolveProfileDesign(p.designConfig,p.theme), theme: command.theme } } }); break;
      case "info": {
        const { whatsapp, website, ...fields } = command.data;
        await tx.businessProfile.update({ where: { id: p.id }, data: { ...fields,
          phone: fields.phone || null, email: fields.email || null, address: fields.address || null, googleMapsUrl: fields.googleMapsUrl || null,
          // Clear fallbacks explicitly when the canonical action is cleared.
          whatsapp: whatsapp ? undefined : null, website: website ? undefined : null } });
        for (const [type, value] of [["WHATSAPP", whatsapp], ["WEBSITE", website]] as const) {
          const matching = p.links.filter(l => l.type === type);
          const current = matching.find(l => l.isActive) ?? matching[0];
          if (value) {
            profileLinkInputSchema.parse({ type, value });
            if (current) await tx.profileLink.update({ where: { id: current.id }, data: { url: value, isActive: true } });
            else await tx.profileLink.create({ data: { ...owner, type, label: getDefaultLabel(type), url: value, sortOrder: p.links.length + (type === "WEBSITE" ? 1 : 0) } });
          } else {
            // Retain records/URLs. Disable all same-type fallbacks so clearing remains clear.
            await tx.profileLink.updateMany({ where: { ...owner, type }, data: { isActive: false } });
          }
        }
        for (const [type, value] of [["PHONE", fields.phone], ["GOOGLE_MAPS", fields.googleMapsUrl]] as const) {
          if (!value) await tx.profileLink.updateMany({ where: { ...owner, type }, data: { isActive: false } });
        }
        break;
      }
    }
    await tx.businessProfile.update({ where: { id: p.id }, data: { layoutRevision: { increment: 1 } } });
    return toV2Data(requireValue(await tx.businessProfile.findUnique({ where: { id: p.id }, include: graph })));
  }, { timeout: 20000 });
}
