import Image from "next/image";
import type { CSSProperties } from "react";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import { type ProfileVisual, textCSS, roleTextCSS, shadows, readableText } from "@/lib/profile-visual";
import { VerificationBadge } from "./VerificationBadge";

export function VisualHeader({business,design}:{business:PublicBusinessProfile;design:ProfileVisual}) {
  const p=business.profile, h=design.hero??{}, b=design.badge??{};
  const composition=h.composition??"COVER_OVERLAP";
  const cover=!!p.coverImageUrl&&!["CENTERED","MINIMAL"].includes(composition);
  const over=cover&&(h.identityPosition==="OVER_IMAGE"||composition==="IMAGE_HERO");
  const overlap=cover&&!over?Math.min(h.overlap??(composition==="COVER_OVERLAP"?48:0),(h.avatarSize??96)*.75,(h.mobileHeight??h.height??240)/2):0;
  const bottomAdjustment=h.paddingBottom===undefined?0:h.paddingBottom-(h.padding??24);
  const foreground=over?readableText(h.overlayColor??"#000000"):undefined;
  const badge=p.isVerified?<VerificationBadge color={b.color??p.verificationColor} tooltip={p.verificationTooltip} design={b}/>:null;
  const align=h.align??"CENTER";
  const fade=h.fade??0;
  const fadeStart=100-fade, fadeEnd=100-fade*.1;
  const coverFade=fade>0?`linear-gradient(to bottom, #000 ${fadeStart}%, transparent ${fadeEnd}%, transparent 100%)`:undefined;
  return <div className="visual-hero" data-composition={composition} style={{minHeight:h.minHeight,marginBottom:over?bottomAdjustment:undefined,"--hero-height":`${h.height??240}px`,"--hero-mobile-height":`${h.mobileHeight??h.height??240}px`,"--hero-curve":`${h.curvedEdge??0}%`} as CSSProperties}>
    {cover&&<div data-profile-cover className="visual-cover" style={{maskImage:coverFade,WebkitMaskImage:coverFade}}><Image src={p.coverImageUrl!} alt="" fill priority sizes="(max-width: 640px) 100vw, 680px" style={{objectFit:h.fit==="CONTAIN"?"contain":"cover",objectPosition:`${h.focalX??50}% ${h.focalY??50}%`}}/><div className="absolute inset-0" style={{background:`color-mix(in srgb, ${h.overlayColor??"#000000"} ${h.overlayOpacity??(over?40:0)}%, transparent)`}}/></div>}
    <header className="visual-identity" data-over-image={over} data-curved={!!h.curvedEdge} style={{color:foreground,bottom:over?-bottomAdjustment:undefined,padding:h.padding??24,paddingBottom:h.paddingBottom??h.padding??24,gap:h.gap??12,textAlign:align.toLowerCase() as CSSProperties["textAlign"],alignItems:{LEFT:"flex-start",CENTER:"center",RIGHT:"flex-end"}[align],marginTop:over?undefined:-overlap}}>
      {p.logoUrl&&<div className="relative shrink-0" style={{width:h.avatarSize??96,height:h.avatarSize??96,maxWidth:"100%"}}><div className="relative h-full w-full overflow-hidden" style={{borderRadius:h.avatarRadius??120,border:`${h.avatarBorder??3}px solid ${h.avatarBorderColor??"#ffffff"}`,boxShadow:shadows[h.avatarShadow??"SOFT"],background:h.avatarBackground}}><Image src={p.logoUrl} alt={p.displayName} fill sizes={`${h.avatarSize??96}px`} style={{objectFit:"cover"}}/></div>{b.placement==="AVATAR"&&<span className="absolute bottom-0 right-0">{badge}</span>}</div>}
      {h.textOrder==="TAGLINE_FIRST"&&h.tagline&&<p style={roleTextCSS(design.typography,"label")}>{h.tagline}</p>}
      <h1 className="text-3xl font-bold" style={{color:foreground,...roleTextCSS(design.typography,"name")}}>{p.displayName||business.name} {b.placement!=="AVATAR"||!p.logoUrl?badge:null}</h1>
      {h.textOrder!=="TAGLINE_FIRST"&&h.tagline&&<p style={roleTextCSS(design.typography,"label")}>{h.tagline}</p>}
      {h.showBusinessType!==false&&business.businessType&&<p className="text-sm" style={roleTextCSS(design.typography,"caption")}>{business.businessType}</p>}
      {h.description&&<p className="max-w-prose text-sm" style={roleTextCSS(design.typography,"body")}>{h.description}</p>}
    </header>
  </div>;
}
