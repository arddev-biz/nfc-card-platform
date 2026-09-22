import "server-only";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { BLOCK_REGISTRY, SYSTEM_BLOCK_ORDER } from "@/lib/blocks/registry";
import { initialV2Sections, V2Error } from "@/lib/services/profile-v2";
import { isRenderableLinkValue } from "@/lib/linkTypes";

async function readPlan(organizationId: string, client: Pick<typeof db, "businessProfile">) {
  const p = await client.businessProfile.findUnique({ where: { organizationId }, include: {
    blockLayouts: { orderBy: { position: "asc" } }, links: { orderBy: { sortOrder: "asc" } },
    organization: { include: { modules: true, menu: { include: { categories: { include: { items: true } } } } } },
  } });
  if (!p) throw new V2Error("Business not found.");
  const legacy = SYSTEM_BLOCK_ORDER.map(key => {
    const row = p.blockLayouts.find(b => b.blockKey === key);
    return { key, visible: row?.isVisible ?? true, position: row?.position ?? BLOCK_REGISTRY[key].defaultPosition };
  });
  const visible = (key: typeof SYSTEM_BLOCK_ORDER[number]) => legacy.find(b => b.key === key)!.visible;
  const proposed = initialV2Sections().map(s => ({ ...s,
    position: legacy.find(b => b.key === s.singletonKey)!.position,
    isVisible: s.singletonKey === "BUSINESS_INFO" ? visible("BUSINESS_INFO") || visible("CONTACT") || visible("LOCATION")
      : s.singletonKey === "LINKS" ? visible("LINKS") || visible("REVIEWS") : visible(s.singletonKey),
    config: s.singletonKey === "BUSINESS_INFO" ? {
      phone: visible("CONTACT"), whatsapp: visible("CONTACT"), email: false,
      website: p.links.some(l => l.type === "WEBSITE" && l.isActive && isRenderableLinkValue(l.type, l.url)) ? visible("LINKS") : visible("BUSINESS_INFO"),
      address: visible("BUSINESS_INFO") && visible("LOCATION"), maps: visible("LOCATION"),
    } : s.config,
  })).sort((a,b) => a.position - b.position).map((s,position) => ({ ...s, position }));
  const linkVisibility = p.links.map(l => ({ id: l.id, visible: l.isActive &&
    (l.type === "GOOGLE_REVIEWS" ? visible("REVIEWS") : ["PHONE", "WHATSAPP", "GOOGLE_MAPS"].includes(l.type) ? false : visible("LINKS")) }));
  const rows = legacy.map(b => {
    const destination = b.key === "CONTACT" || b.key === "LOCATION" ? "BUSINESS_INFO" : b.key === "REVIEWS" ? "LINKS" : b.key;
    const next = proposed.find(s => s.singletonKey === destination)!;
    return { oldSection: b.key, destination, oldVisibility: b.visible, resultingVisibility: b.visible && next.isVisible,
      oldPosition: b.position, proposedPosition: next.position,
      behavior: b.key === "CONTACT" || b.key === "LOCATION" ? "Actions become ordinary Business Info rows; hidden source actions remain hidden."
        : b.key === "REVIEWS" ? "Review becomes a Links card, gated separately from ordinary links." : "Core section retained; spacing/position may change." };
  });
  return { p, proposed, linkVisibility, rows, fingerprint: createHash("sha256").update(JSON.stringify(p)).digest("hex") };
}
export async function previewV2Upgrade(organizationId: string) {
  const plan = await readPlan(organizationId, db);
  return { version: plan.p.builderVersion, fingerprint: plan.fingerprint, rows: plan.rows,
    fields: plan.proposed.find(s => s.singletonKey === "BUSINESS_INFO")!.config,
    links: plan.linkVisibility,
    warning: "Contact/Location cards merge into Business Info; Reviews moves into Links. Layout changes are explicit. Ambiguous fields are hidden conservatively. Legacy data/layout records are retained." };
}
export async function confirmV2Upgrade(organizationId: string, fingerprint: string) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "BusinessProfile" WHERE "organizationId" = ${organizationId} FOR UPDATE`;
    const plan = await readPlan(organizationId, tx);
    if (plan.p.builderVersion === 2) return;
    if (plan.fingerprint !== fingerprint) throw new V2Error("Profile changed since preview. Review a fresh conversion preview.");
    if (await tx.profileSection.count({ where: { businessProfileId: plan.p.id } })) throw new V2Error("Unexpected V2 records on legacy profile. Conversion aborted.");
    await tx.profileSection.createMany({ data: plan.proposed.map(s => ({ ...s, businessProfileId: plan.p.id })) });
    for (const l of plan.linkVisibility) await tx.profileLink.update({ where: { id: l.id }, data: { v2IsVisible: l.visible } });
    await tx.businessProfile.update({ where: { id: plan.p.id }, data: { builderVersion: 2,
      layoutRevision: { increment: 1 }, v2ConvertedAt: new Date(),
      v2ConversionSnapshot: { version: 1, fingerprint, rows: plan.rows, fields: plan.proposed.find(s => s.singletonKey === "BUSINESS_INFO")!.config, links: plan.linkVisibility } } });
  }, { isolationLevel: "Serializable", timeout: 20000 });
}
