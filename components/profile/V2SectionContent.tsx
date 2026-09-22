import {SocialIconSurface} from "./SocialIconSurface";
import {SemanticIcon} from "./SemanticIcon";
import type { LinkType } from "@prisma/client";
import { followerLabel } from "@/lib/social-followers";
import { surfaceAttributes } from "@/lib/profile-design";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import type { ProfileViewModel } from "@/lib/profileView";
import { infoConfig, socialConfig, itemConfigs, textStyleValues, type ItemKind, type V2Section, type V2Link } from "@/lib/profile-v2";
import { buildLinkHref, isRenderableLinkValue, opensInNewTab } from "@/lib/linkTypes";
import { ProfileLinkIcon, ProfileMedia } from "@/components/profile/ProfileMedia";

export function V2SectionContent({ section: s, business, viewModel: vm, menuAvailable, slug }: {
  section: V2Section; business: PublicBusinessProfile; viewModel: ProfileViewModel; menuAvailable: boolean; slug: string;
}) {
  const p = business.profile, v2 = business.v2!;
  const links = v2.links.filter(l => l.isActive && isRenderableLinkValue(l.type, l.url));
  const linkOf = (type: string) => links.find(l => l.type === type);
  const websiteValue = linkOf("WEBSITE")?.url || p.website;
  const website = websiteValue && isRenderableLinkValue("WEBSITE", websiteValue) ? websiteValue : null;
  const actions: Record<string, string | null | undefined> = {
    PHONE: vm.callHref, WHATSAPP: vm.whatsappHref, EMAIL: p.email && isRenderableLinkValue("EMAIL", p.email) ? buildLinkHref("EMAIL",p.email) : undefined,
    WEBSITE: website, MAP: vm.directionsHref && isRenderableLinkValue("GOOGLE_MAPS",vm.directionsHref) ? vm.directionsHref : null, REVIEW: vm.reviewsHref,
  };
  const button = (label: string, href: string, type: LinkType | "MENU" = "CUSTOM") => <a className="v2-surface v2-action flex items-center gap-3 font-medium" href={href} rel="noopener noreferrer"><ProfileLinkIcon type={type} mode="DEFAULT" url={null} iconSet={v2.design?.iconSet} iconStyle={v2.design?.iconStyle} iconColor={v2.design?.iconColor}/><span className="min-w-0 break-words">{label}</span></a>;
  function linkCard(l: V2Link, iconSize = 24, labels = true, social = false) {
    return <a href={buildLinkHref(l.type, l.url)} aria-label={l.label || l.socialNetwork || l.type} target={opensInNewTab(l.type) ? "_blank" : undefined} rel="noopener noreferrer"
      className={social ? "v2-social flex h-full items-center gap-2" : "v2-surface v2-action flex h-full items-center gap-3"}>
      <SocialIconSurface config={social?s.config:{}}><ProfileLinkIcon destination={l.url} type={l.type} mode={l.iconMode} url={l.iconUrl} network={l.socialNetwork} size={iconSize} iconSet={v2.design?.iconSet} iconStyle={v2.design?.iconStyle} iconColor={social&&typeof s.config.iconColor==="string"&&s.config.iconColor!=="INHERIT"?s.config.iconColor:v2.design?.iconColor} /></SocialIconSurface>
      {social&&s.config.showFollowerCount===true&&followerLabel(l.followers)&&<span className="text-xs">{followerLabel(l.followers)}</span>}
      {labels && <span className="min-w-0 break-words font-medium">{l.label || l.socialNetwork || l.type}</span>}
    </a>;
  }
  let content: React.ReactNode = null;
  switch (s.singletonKey) {
    case "BIO": content = p.bio ? <p className="whitespace-pre-wrap leading-relaxed" style={textStyleValues(s.config)}>{p.bio}</p> : null; break;
    case "BUSINESS_INFO": {
      const cfg = infoConfig.safeParse(s.config); if (!cfg.success) break;
      const values = [
        { key: "phone" as const, label: p.phone || linkOf("PHONE")?.url, href: actions.PHONE },
        { key: "whatsapp" as const, label: "WhatsApp", href: actions.WHATSAPP },
        { key: "email" as const, label: p.email, href: actions.EMAIL },
        { key: "website" as const, label: website, href: website },
        { key: "address" as const, label: p.address, href: null },
        { key: "maps" as const, label: "Directions", href: actions.MAP },
      ].filter(row => cfg.data[row.key] && row.label && (row.key === "address" || row.href));
      content = values.length ? <ul className="divide-y divide-current/10">{values.map(row => <li className="break-words py-2" key={row.key}>{row.href ? <a className="v2-info-action flex items-center gap-3 rounded-lg p-2" href={row.href}><SemanticIcon type={row.key==="maps"?"GOOGLE_MAPS":row.key.toUpperCase()} iconSet={v2.design?.iconSet} iconStyle={v2.design?.iconStyle} iconColor={v2.design?.iconColor}/>{row.label}</a> : row.label}</li>)}</ul> : null; break;
    }
    case "LINKS": content = <div className="v2-grid">{links.filter(l => !l.socialSectionId && l.v2IsVisible).map(l => <div data-width={l.width} key={l.id}>{linkCard(l)}</div>)}</div>; break;
    case "SOCIALS": {
      const parsed = socialConfig.safeParse(s.config); const c = parsed.success ? parsed.data : socialConfig.parse({});
      content = <div className="flex flex-wrap" style={{ gap: { COMPACT: 8, COMFORTABLE: 16, SPACIOUS: 24 }[c.spacing], justifyContent: { LEFT: "flex-start", CENTER: "center", RIGHT: "flex-end" }[c.align] }}>
        {links.filter(l => l.socialSectionId === s.id && l.v2IsVisible).map(l => <div key={l.id}>{linkCard(l, { SMALL: 20, MEDIUM: 28, LARGE: 36 }[c.iconSize], c.labels || l.iconMode === "NONE", true)}</div>)}</div>; break;
    }
    case "MENU": content = menuAvailable ? button("View Menu →", `/${slug}/menu`, "MENU") : null; break;
    default: content = <div className="v2-grid">{s.items.filter(i => i.isVisible).map(i => {
      if (!Object.prototype.hasOwnProperty.call(itemConfigs, i.kind)) return null;
      const parsed = itemConfigs[i.kind as ItemKind].safeParse(i.config);
      if (!parsed.success) return null;
      const c = i.config;
      let node: React.ReactNode = null;
      if (["HEADING", "TEXT", "ICON_TEXT"].includes(i.kind)) {
        const { text, icon, ...style } = c;
        node = <div className="whitespace-pre-wrap break-words" style={textStyleValues(style)}>
          {i.kind === "ICON_TEXT" && <span aria-hidden="true">{{ STAR: "★", HEART: "♥", CHECK: "✓", PIN: "⌖" }[String(icon) as "STAR"]} </span>}
          {i.kind === "HEADING" ? <h3>{String(text || "")}</h3> : String(text || "")}</div>;
      } else if (i.kind === "LINK") {
        const ref = links.find(l => l.id === i.referencedProfileLinkId);
        node = i.referencedProfileLinkId ? (ref ? linkCard(ref) : null) : c.url ? button(String(c.label), String(c.url)) : null;
      }
      else if (i.kind === "MENU") node = menuAvailable ? button(String(c.label || "View Menu"), `/${slug}/menu`, "MENU") : null;
      else if (i.kind === "DIVIDER") node = <hr className="opacity-30" />;
      else if (i.kind === "SPACER") node = <div style={{ height: { SMALL: 12, MEDIUM: 24, LARGE: 48 }[String(c.size) as "SMALL"] }} />;
      else if (i.kind === "IMAGE" || i.kind === "CAROUSEL") node = i.images.length ? <ProfileMedia images={i.images} config={c} carousel={i.kind === "CAROUSEL"} /> : null;
      else {
        const ref = i.referencedProfileLinkId ? links.find(l => l.id === i.referencedProfileLinkId) : undefined;
        const href = ref ? buildLinkHref(ref.type, ref.url) : i.kind === "SOCIAL" ? null : actions[i.kind === "CONTACT" ? String(c.action) : i.kind];
        if (href) node = button(String(c.label || ref?.label || c.action || i.kind), href);
      }
      return node ? <div className="v2-surface v2-item" {...surfaceAttributes(c.surface, ["HEADING","TEXT","ICON_TEXT","DIVIDER","SPACER"].includes(i.kind) ? "NONE" : "INHERIT")} key={i.id} data-width={i.width}>{node}</div> : null;
    })}</div>;
  }
  return <section className="v2-surface v2-section min-w-0 space-y-3" {...surfaceAttributes(s.config.surface, s.singletonKey === "BUSINESS_INFO" ? "INHERIT" : "NONE")} aria-label={s.visibleTitle || s.singletonKey || "Custom content"}>
    {s.visibleTitle && <h2 className="text-lg font-semibold">{s.visibleTitle}</h2>}{content}
  </section>;
}
