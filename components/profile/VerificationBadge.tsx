import type {z} from "zod";
import {useId} from "react";
import {badgeArtwork,isFixedBadgeColor,type BadgeVariant} from "@/lib/badge-styles";
import Image from "next/image";
import type {badgeDesign} from "@/lib/profile-visual";
export function VerificationBadge({ color = "#2563EB", tooltip, design = {}, decorative=false }: { decorative?:boolean; color?: string; tooltip?:string|null; design?:z.infer<typeof badgeDesign> }) {
  const id=useId().replace(/:/g,"");
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#2563EB";
  const channels = [1,3,5].map(start => parseInt(safeColor.slice(start,start+2),16)/255)
    .map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  const luminance = channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  const text=tooltip?.trim()&&!/[<>]/.test(tooltip)&&tooltip.length<=200?tooltip:"Verified profile";
  if(design.variant==="BETA"){const size=Math.round((design.size??24)*1.1);return <span className="verification-badge group relative inline-flex align-middle" tabIndex={decorative?undefined:0} role={decorative?undefined:"img"} aria-label={decorative?undefined:text} aria-hidden={decorative||undefined}><span role="tooltip" aria-hidden="true" className="verification-tooltip">{text}</span><Image unoptimized src="/premium-badge-beta.svg" alt="" aria-hidden="true" width={size} height={size} className="inline-block shrink-0 align-middle"/></span>;}
  if(isFixedBadgeColor(design.variant)) {
    const variant=design.variant as BadgeVariant;
    const gold=variant==="LUXURY_GOLD"||variant==="GOLD_PREMIUM",neon=variant==="NEON_TICKET";
    const iridescent=["CRYSTAL","HOLOGRAPHIC","IRIDESCENT_GLASS","NEON_GLASS"].includes(variant);
    const shape=variant==="CRYSTAL"?badgeArtwork.crystal:variant==="GLOSSY_SHIELD"?badgeArtwork.shield:variant==="NEON_GLASS"?badgeArtwork.hex:neon?badgeArtwork.ticket:variant==="LUXURY_GOLD"?badgeArtwork.luxury:["HOLOGRAPHIC","GOLD_PREMIUM","GLOSSY_BLUE"].includes(variant)?badgeArtwork.seal:badgeArtwork.circle;
    const stops=gold?["#fff9bd","#ffc83c","#b46a07"]:neon?["#dcffe8","#00e9b1","#008ef7"]:iridescent?["#ecfbff","#20d4f4","#2851ef","#cf7aef"]:["#b6ffff","#00baf7","#0056ed"];
    const darkCheck=gold&&variant!=="LUXURY_GOLD"||neon,size=design.size??24;
    return <span className="verification-badge group relative inline-flex shrink-0 align-middle" style={{width:size,height:size}} tabIndex={decorative?undefined:0} role={decorative?undefined:"img"} aria-label={decorative?undefined:text} aria-hidden={decorative||undefined}><span role="tooltip" aria-hidden="true" className="verification-tooltip">{text}</span><svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="-3 -3 106 106" style={{display:"block"}} data-badge-variant={variant}>
      <defs>
        <linearGradient id={id+"fill"} x1="0" y1="0" x2="1" y2="1">{stops.map((c,i)=><stop key={c} offset={i/(stops.length-1)} stopColor={c}/>)}</linearGradient>
        <linearGradient id={id+"rim"} x1="0" y1="0" x2="1" y2="1"><stop stopColor={gold?"#fff8b0":"#e6ffff"}/><stop offset=".35" stopColor={gold?"#ffe18a":"#40eaff"}/><stop offset=".65" stopColor={gold?"#9c5100":"#2258cf"}/><stop offset="1" stopColor={gold?"#ffdf70":iridescent?"#f6b7ff":"#13caff"}/></linearGradient>
        <linearGradient id={id+"check"} x1="0" y1="0" x2="1" y2="1"><stop stopColor={darkCheck?gold?"#d3860e":"#00897e":gold?"#fff5a7":"#ffffff"}/><stop offset="1" stopColor={darkCheck?gold?"#603200":"#003b47":gold?"#da8a15":"#cddcfa"}/></linearGradient>
        <clipPath id={id+"clip"}><path d={shape}/></clipPath>
      </defs>
      <path d={shape} fill={"url(#"+id+"fill)"} stroke={gold?"#895005":"#164faf"} strokeWidth="2"/>
      <path d={shape} fill="none" stroke={"url(#"+id+"rim)"} strokeWidth="5"/>
      <path d={shape} transform="translate(7 7) scale(.86)" fill={variant==="LUXURY_GOLD"?"#171719":"url(#"+id+"fill)"} stroke={gold?"#fff2a1":"#d5ffff"} strokeOpacity=".8" strokeWidth="1.4"/>
      <g clipPath={"url(#"+id+"clip)"}>
        {iridescent&&<><path d="M0 0H50V50L0 78Z" fill="#eebeff" opacity=".25"/><path d="M50 0L100 50L50 100V50Z" fill="#47ffff" opacity=".2"/></>}
        <path d="M7 28Q21 4 49 7Q33 23 16 36Z" fill="#ffffff" opacity=".55"/>
        <path d="M62 85Q80 80 91 61" fill="none" stroke={gold?"#fff9bb":"#d0faff"} strokeWidth="2" opacity=".55"/>
      </g>
      <path d="M32 51L44 63L69 37" transform={neon?"translate(10 10) scale(.8)":"translate(0 2)"} fill="none" stroke={darkCheck?"#001e31":"#17346e"} strokeOpacity=".35" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32 51L44 63L69 37" transform={neon?"translate(10 8) scale(.8)":undefined} fill="none" stroke={"url(#"+id+"check)"} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M31 49L44 62L69 36" transform={neon?"translate(10 8) scale(.8)":undefined} fill="none" stroke={gold?"#fff6bf":"#ffffff"} strokeOpacity=".6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg></span>;
  }
  return <span className="verification-badge group relative inline-flex align-middle" tabIndex={decorative?undefined:0} role={decorative?undefined:"img"} aria-label={decorative?undefined:text} aria-hidden={decorative||undefined}><span role="tooltip" aria-hidden="true" className="verification-tooltip">{text}</span><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="inline-block h-6 w-6 shrink-0 align-middle" style={{ color: safeColor, width:design.size, height:design.size }}>
    {design.variant==="SEAL"?<path fill="currentColor" d="m12 1 2.4 2 3.1-.1 1.1 2.9 2.6 1.7-.6 3 1.4 2.8-2 2.4.1 3.1-2.9 1.1-1.7 2.6-3-.6-2.8 1.4-2.4-2-3.1.1-1.1-2.9L.5 16.8l.6-3L0 11l2-2.4-.1-3.1 2.9-1.1L6.5 1.8l3 .6Z"/>:design.variant==="SHIELD"?<path fill="currentColor" d="M12 1 22 5v6c0 6-5 10-10 12C7 21 2 17 2 11V5Z"/>:design.variant!=="CHECK"?<circle cx="12" cy="12" r="10" fill="currentColor" stroke={luminance > .179 ? "#172033" : "#fff"} strokeOpacity=".35" />:null}
    <path d="m7.5 12 3 3 6-6" fill="none" stroke={design.checkColor??(design.variant==="CHECK"?safeColor:luminance > .179 ? "#172033" : "#fff")} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg></span>;
}
