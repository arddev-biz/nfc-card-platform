import {VisualCollection} from "./VisualCollection";
import Image from "next/image";
import {VisualAction} from "./VisualAction";
import {inheritVisual,readVisual,linkStyle,surfaceCSS,textCSS,roleTextCSS,layoutCSS,collectionCSS,actionCSS,type VisualOverride} from "@/lib/profile-visual";
import {contactCard} from "@/lib/profile-contact";
import {SocialIconSurface} from "./SocialIconSurface";
import {SocialIconRow} from "./SocialIconRow";
import {SemanticIcon} from "./SemanticIcon";
import type { LinkType } from "@prisma/client";
import { followerLabel } from "@/lib/social-followers";
import { surfaceAttributes } from "@/lib/profile-design";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import type { ProfileViewModel } from "@/lib/profileView";
import { infoConfig, socialConfig, itemConfigs, textStyleValues, type ItemKind, type V2Section, type V2Link } from "@/lib/profile-v2";
import { buildLinkHref, isRenderableLinkValue, opensInNewTab } from "@/lib/linkTypes";
import { ProfileLinkIcon, ProfileMedia } from "@/components/profile/ProfileMedia";

export function V2SectionContent({ section: s, business, viewModel: vm, menuAvailable, slug, editorSelected=false }: {
  section: V2Section; business: PublicBusinessProfile; viewModel: ProfileViewModel; menuAvailable: boolean; slug: string; editorSelected?:boolean;
}) {
  const p = business.profile, v2 = business.v2!;
  const visual=v2.design?.visual, local=readVisual(s.config.visual);
  const styled=!!visual||!!s.config.visual;
  const sectionStyle={...(s.kind==="CUSTOM"?surfaceCSS(local.surface):{}),...layoutCSS(local.layout),...textCSS(local.text),...(s.kind==="SOCIALS"&&local.layout?.before!==undefined?{"--social-space-before":`${local.layout.before}px`}:{})};
  const base=inheritVisual(visual?{surface:visual.surface,action:visual.action}:undefined,local);
  const layoutProps={className:local.layout?.mode?"visual-layout":"v2-grid","data-layout":local.layout?.mode,style:collectionCSS(local.layout)};
  const links = v2.links.filter(l => l.isActive && isRenderableLinkValue(l.type, l.url));
  const firstLink=links.find(link=>!link.socialSectionId&&link.v2IsVisible);
  const firstActionSection=[...v2.sections].sort((a,b)=>a.position-b.position).find(section=>section.isVisible&&(section.singletonKey==="LINKS"&&!!firstLink||section.singletonKey==="MENU"&&menuAvailable));
  const linkOf = (type: string) => links.find(l => l.type === type);
  const websiteValue = linkOf("WEBSITE")?.url || p.website;
  const website = websiteValue && isRenderableLinkValue("WEBSITE", websiteValue) ? websiteValue : null;
  const actions: Record<string, string | null | undefined> = {
    PHONE: vm.callHref, WHATSAPP: vm.whatsappHref, EMAIL: p.email && isRenderableLinkValue("EMAIL", p.email) ? buildLinkHref("EMAIL",p.email) : undefined,
    WEBSITE: website, MAP: vm.directionsHref && isRenderableLinkValue("GOOGLE_MAPS",vm.directionsHref) ? vm.directionsHref : null, REVIEW: vm.reviewsHref,
  };
  const info=v2.sections.find(section=>section.singletonKey==="BUSINESS_INFO"&&section.isVisible);
  const publication=infoConfig.safeParse(info?.config);
  const allowed=publication.success?publication.data:null;
  const card=contactCard(p.displayName||business.name,{phone:allowed?.phone?p.phone:null,email:allowed?.email?p.email:null,address:allowed?.address?p.address:null,website:allowed?.website?website:null});
  const icon=(type:LinkType|"MENU",size?:number,customColor=false)=><ProfileLinkIcon type={type} mode="DEFAULT" url={null} size={size} iconSet={v2.design?.iconSet} iconStyle={v2.design?.iconStyle} iconColor={customColor?"MONOCHROME":v2.design?.iconColor}/>;
  const styledButton=(label:string,href:string,type:LinkType|"MENU"="CUSTOM",override?:VisualOverride,subtitle?:string,download?:string)=>{
    const style=inheritVisual(base,override);
    return <VisualAction href={href} label={label} subtitle={subtitle} visual={style} typography={visual?.typography} icon={icon(type,style.action?.iconSize,!!style.action?.iconColor)} download={download}/>;
  };
  const button = (label: string, href: string, type: LinkType | "MENU" = "CUSTOM") => styled?styledButton(label,href,type):<a className="v2-surface v2-action flex items-center gap-3 font-medium" href={href} rel="noopener noreferrer"><ProfileLinkIcon type={type} mode="DEFAULT" url={null} iconSet={v2.design?.iconSet} iconStyle={v2.design?.iconStyle} iconColor={v2.design?.iconColor}/><span className="min-w-0 break-words">{label}</span></a>;
  function linkCard(l: V2Link, iconSize = 24, labels = true, social = false, override?:VisualOverride) {
    const overrides=s.config.linkStyles as Record<string,unknown>|undefined;
    const parsed=linkStyle.safeParse(overrides?.[l.id]);
    const linkVisual=inheritVisual(social?visual?.socials:base,!social&&s.id===firstActionSection?.id&&l.id===firstLink?.id?visual?.primaryAction:undefined,local,parsed.success?parsed.data:undefined,override);
    if(social&&["SMALL","MEDIUM","LARGE"].includes(String(s.config.iconSize))&&!local.action?.iconSize&&!override?.action?.iconSize&&!(parsed.success&&parsed.data.action?.iconSize))linkVisual.action={...linkVisual.action,iconSize};
    // Explicit section modes take precedence over an inherited single-color theme.
    // Intentional item colors still have highest priority.
    if(social&&["BRAND","THEME"].includes(String(s.config.iconColor))&&!(parsed.success&&parsed.data.action?.iconColor)&&!override?.action?.iconColor&&linkVisual.action){linkVisual.action={...linkVisual.action};delete linkVisual.action.iconColor;}
    const iconMode=linkVisual.action?.iconColor?"MONOCHROME":social&&typeof s.config.iconColor==="string"&&s.config.iconColor!=="INHERIT"?s.config.iconColor:v2.design?.iconColor;
    if((styled||parsed.success||override)&&(!social||s.config.composition==="CARDS"))return <VisualAction href={buildLinkHref(l.type,l.url)} label={l.label||l.socialNetwork||l.type} subtitle={parsed.success?parsed.data.subtitle:undefined} visual={linkVisual} typography={visual?.typography} external={opensInNewTab(l.type)} icon={l.iconMode==="NONE"?null:<ProfileLinkIcon brandArtwork={linkVisual.action?.brandArtwork} destination={l.url} type={l.type} mode={l.iconMode} url={l.iconUrl} network={l.socialNetwork} size={linkVisual.action?.iconSize??iconSize} iconSet={v2.design?.iconSet} iconStyle={v2.design?.iconStyle} iconColor={iconMode}/>}/>;
    return <a href={buildLinkHref(l.type, l.url)} aria-label={l.label || l.socialNetwork || l.type} target={opensInNewTab(l.type) ? "_blank" : undefined} rel="noopener noreferrer"
      style={social&&(styled||parsed.success)?{...surfaceCSS(linkVisual.surface),...textCSS(linkVisual.text),...actionCSS(linkVisual.action)}:undefined} className={social ? "v2-social flex h-full items-center gap-2" : "v2-surface v2-action flex h-full items-center gap-3"}>
      {linkVisual.action?.iconPosition!=="NONE"&&<span className="visual-action-icon" style={{color:linkVisual.action?.iconColor,background:linkVisual.action?.iconBackground,borderRadius:linkVisual.action?.iconRadius,width:linkVisual.action?.iconContainerSize,height:linkVisual.action?.iconContainerSize}}><SocialIconSurface config={social?s.config:{}} network={l.socialNetwork} type={l.type} destination={l.url}><ProfileLinkIcon brandArtwork={linkVisual.action?.brandArtwork} destination={l.url} type={l.type} mode={l.iconMode} url={l.iconUrl} network={l.socialNetwork} size={linkVisual.action?.iconSize??iconSize} iconSet={v2.design?.iconSet} iconStyle={v2.design?.iconStyle} iconColor={social&&s.config.containerStyle==="BRANDED"?"MONOCHROME":linkVisual.action?.iconColor?"MONOCHROME":social&&typeof s.config.iconColor==="string"&&s.config.iconColor!=="INHERIT"?s.config.iconColor:v2.design?.iconColor} /></SocialIconSurface></span>}
      {social&&s.config.showFollowerCount===true&&followerLabel(l.followers)&&<span className="text-xs">{followerLabel(l.followers)}</span>}
      {(labels||linkVisual.action?.iconPosition==="NONE") && <span className="min-w-0 break-words font-medium">{l.label || l.socialNetwork || l.type}</span>}
    </a>;
  }
  let content: React.ReactNode = null;
  switch (s.singletonKey) {
    case "BIO": content = p.bio ? <p className="whitespace-pre-wrap leading-relaxed" style={{...textStyleValues(s.config),...(visual?roleTextCSS(visual.typography,"body"):{}),...textCSS(local.text)}}>{p.bio}</p> : null; break;
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
      content = values.length ? <ul {...(local.layout?.mode?layoutProps:{className:styled?"visual-contact":"divide-y divide-current/10"})}>{values.map(row => <li className={styled?"break-words":"break-words py-2"} key={row.key}>{row.href&&styled?styledButton(row.label!,row.href,row.key==="maps"?"GOOGLE_MAPS":row.key.toUpperCase() as LinkType):row.href ? <a className="v2-info-action flex items-center gap-3 rounded-lg p-2" href={row.href}><SemanticIcon type={row.key==="maps"?"GOOGLE_MAPS":row.key.toUpperCase()} iconSet={v2.design?.iconSet} iconStyle={v2.design?.iconStyle} iconColor={v2.design?.iconColor}/>{row.label}</a> : row.label}</li>)}</ul> : null; break;
    }
    case "LINKS": content = <VisualCollection {...layoutProps}>{links.filter(l => !l.socialSectionId && l.v2IsVisible).map(l => <div data-width={l.width} data-builder-link-id={l.id} key={l.id}>{linkCard(l)}</div>)}</VisualCollection>; break;
    case "SOCIALS": {
      const parsed = socialConfig.safeParse(s.config); const c = parsed.success ? parsed.data : socialConfig.parse({});
      if(c.composition!=="CARDS"){
        content=<SocialIconRow gap={local.layout?.gap??{COMPACT:2,COMFORTABLE:16,SPACIOUS:24}[c.spacing]} align={c.align}>{links.filter(l=>l.socialSectionId===s.id&&l.v2IsVisible).map(l=><div data-builder-link-id={l.id} key={l.id}>{linkCard(l,{SMALL:20,MEDIUM:28,LARGE:36}[c.iconSize],c.labels||l.iconMode==="NONE",true)}</div>)}</SocialIconRow>;
        break;
      }
      content = <div className={c.composition==="CARDS"||local.layout?.mode?"visual-layout":"flex flex-wrap"} data-layout={local.layout?.mode??(c.composition==="CARDS"?"STACK":undefined)} style={{ ...collectionCSS(local.layout), gap: local.layout?.gap??{ COMPACT: 8, COMFORTABLE: 16, SPACIOUS: 24 }[c.spacing], justifyContent: { LEFT: "flex-start", CENTER: "center", RIGHT: "flex-end" }[c.align] }}>
        {links.filter(l => l.socialSectionId === s.id && l.v2IsVisible).map(l => <div data-builder-link-id={l.id} key={l.id}>{linkCard(l, { SMALL: 20, MEDIUM: 28, LARGE: 36 }[c.iconSize], c.composition==="CARDS"||c.labels || l.iconMode === "NONE", true)}</div>)}</div>; break;
    }
    case "MENU": content = menuAvailable ? styled?styledButton("View Menu",`/${slug}/menu`,"MENU",inheritVisual(s.id===firstActionSection?.id?visual?.primaryAction:undefined,local)):button("View Menu", `/${slug}/menu`, "MENU") : null; break;
    default: content = <VisualCollection {...layoutProps}>{s.items.filter(i => i.isVisible).map(i => {
      if (!Object.prototype.hasOwnProperty.call(itemConfigs, i.kind)) return null;
      const parsed = itemConfigs[i.kind as ItemKind].safeParse(i.config);
      if (!parsed.success) return null;
      const c = parsed.data as Record<string,unknown>;
      const itemVisual=readVisual(c.visual), itemStyled=styled||!!c.visual;
      const merged=inheritVisual(base,itemVisual);
      let node: React.ReactNode = null;
      if (["HEADING", "TEXT", "ICON_TEXT"].includes(i.kind)) {
        const { text, icon, testimonial, ...style } = c;
        node = <div className="whitespace-pre-wrap break-words" style={{...textStyleValues(style),...(visual?roleTextCSS(visual.typography,"body"):{}),...textCSS(local.text),...textCSS(itemVisual.text)}}>
          {i.kind === "ICON_TEXT" && <span aria-hidden="true">{{ STAR: "★", HEART: "♥", CHECK: "✓", PIN: "⌖" }[String(icon) as "STAR"]} </span>}
          {i.kind === "HEADING" ? <h3 style={{...(visual?roleTextCSS(visual.typography,"heading"):{}),...textCSS(local.text),...textCSS(itemVisual.text)}}>{String(text || "")}</h3> : testimonial ? <figure>{i.images[0]&&<Image src={i.images[0].url} alt={i.images[0].alt} width={64} height={64} className="mb-3 rounded-full object-cover"/>}<blockquote>{String(text||"")}</blockquote><figcaption className="mt-3 text-sm">{typeof testimonial==="object"&&testimonial!==null&&"author" in testimonial&&String(testimonial.author)}{typeof testimonial==="object"&&testimonial!==null&&"role" in testimonial&&<span className="block">{String(testimonial.role)}</span>}{typeof testimonial==="object"&&testimonial!==null&&"rating" in testimonial&&<span aria-label={`${testimonial.rating} out of 5 stars`}>{"★".repeat(Number(testimonial.rating))}</span>}</figcaption></figure> : String(text || "")}</div>;
      } else if (i.kind === "LINK") {
        const ref = links.find(l => l.id === i.referencedProfileLinkId);
        node = i.referencedProfileLinkId ? (ref ? linkCard(ref,24,true,false,itemStyled?merged:undefined) : null) : c.url ? itemStyled?styledButton(String(c.label),String(c.url),"CUSTOM",itemVisual,String(c.subtitle??"")):button(String(c.label), String(c.url)) : null;
      }
      else if (i.kind === "MENU") node = menuAvailable ? itemStyled?styledButton(String(c.label||"View Menu"),`/${slug}/menu`,"MENU",itemVisual,String(c.subtitle??"")):button(String(c.label || "View Menu"), `/${slug}/menu`, "MENU") : null;
      else if (i.kind === "DIVIDER") node = <hr className="opacity-30" />;
      else if (i.kind === "SPACER") node = <div style={{ height: { SMALL: 12, MEDIUM: 24, LARGE: 48 }[String(c.size) as "SMALL"] }} />;
      else if (i.kind === "IMAGE" || i.kind === "CAROUSEL") node = i.images.length ? <ProfileMedia images={i.images} config={c} carousel={i.kind === "CAROUSEL"} /> : null;
      else if(i.kind==="CONTACT"&&c.action==="SAVE_CONTACT") node=styledButton(String(c.label||"Save Contact"),card,"CUSTOM",itemVisual,String(c.subtitle??""),"contact.vcf");
      else {
        const ref = i.referencedProfileLinkId ? links.find(l => l.id === i.referencedProfileLinkId) : undefined;
        const href = ref ? buildLinkHref(ref.type, ref.url) : i.kind === "SOCIAL" ? null : actions[i.kind === "CONTACT" ? String(c.action) : i.kind];
        if (href) node = itemStyled?styledButton(String(c.label||ref?.label||c.action||i.kind),href,ref?.type??(i.kind==="MAP"?"GOOGLE_MAPS":i.kind==="REVIEW"?"GOOGLE_REVIEWS":i.kind==="CONTACT"?String(c.action) as LinkType:"CUSTOM"),itemVisual,String(c.subtitle??"")):button(String(c.label || ref?.label || c.action || i.kind), href);
      }
      return node ? <div data-visual-item={itemStyled&&["LINK","CONTACT","MAP","REVIEW","SOCIAL","MENU"].includes(i.kind)} style={itemStyled&&!["LINK","CONTACT","MAP","REVIEW","SOCIAL","MENU"].includes(i.kind)?{...surfaceCSS(itemVisual.surface),...layoutCSS(itemVisual.layout)}:layoutCSS(itemVisual.layout)} className="v2-surface v2-item" {...surfaceAttributes(c.surface, ["HEADING","TEXT","ICON_TEXT","DIVIDER","SPACER"].includes(i.kind) ? "NONE" : "INHERIT")} key={i.id} data-width={i.width}>{node}</div> : null;
    })}</VisualCollection>;
  }
  return <section data-section-id={s.id} data-editor-selected={editorSelected||undefined} data-visual-section={styled||undefined} style={sectionStyle} className="v2-surface v2-section min-w-0 space-y-3" {...surfaceAttributes(s.config.surface, s.singletonKey === "BUSINESS_INFO" && !styled ? "INHERIT" : "NONE")} aria-label={s.visibleTitle || s.singletonKey || "Custom content"}>
    {s.visibleTitle && <h2 style={{...(visual?roleTextCSS(visual.typography,"heading"):{}),...textCSS(local.text)}} className="text-lg font-semibold">{s.visibleTitle}</h2>}{content}
  </section>;
}
