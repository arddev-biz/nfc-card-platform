import type {z} from "zod";
import Image from "next/image";
import type {badgeDesign} from "@/lib/profile-visual";
export function VerificationBadge({ color = "#2563EB", tooltip, design = {} }: { color?: string; tooltip?:string|null; design?:z.infer<typeof badgeDesign> }) {
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#2563EB";
  const channels = [1,3,5].map(start => parseInt(safeColor.slice(start,start+2),16)/255)
    .map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  const luminance = channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  const text=tooltip?.trim()&&!/[<>]/.test(tooltip)&&tooltip.length<=200?tooltip:"Verified profile";
  if(design.variant==="BETA")return <span className="verification-badge group relative inline-flex align-middle" tabIndex={0} aria-label={text}><span role="tooltip" className="verification-tooltip">{text}</span><Image unoptimized src="/premium-badge-beta.svg" alt={text} width={design.size??24} height={design.size??24} className="inline-block shrink-0 align-middle"/></span>;
  return <span className="verification-badge group relative inline-flex align-middle" tabIndex={0} aria-label={text}><span role="tooltip" className="verification-tooltip">{text}</span><svg role="img" aria-label={text} viewBox="0 0 24 24" className="inline-block h-6 w-6 shrink-0 align-middle" style={{ color: safeColor, width:design.size, height:design.size }}>
    <title>{text}</title>{design.variant==="SEAL"?<path fill="currentColor" d="m12 1 2.4 2 3.1-.1 1.1 2.9 2.6 1.7-.6 3 1.4 2.8-2 2.4.1 3.1-2.9 1.1-1.7 2.6-3-.6-2.8 1.4-2.4-2-3.1.1-1.1-2.9L.5 16.8l.6-3L0 11l2-2.4-.1-3.1 2.9-1.1L6.5 1.8l3 .6Z"/>:design.variant==="SHIELD"?<path fill="currentColor" d="M12 1 22 5v6c0 6-5 10-10 12C7 21 2 17 2 11V5Z"/>:design.variant!=="CHECK"?<circle cx="12" cy="12" r="10" fill="currentColor" stroke={luminance > .179 ? "#172033" : "#fff"} strokeOpacity=".35" />:null}
    <path d="m7.5 12 3 3 6-6" fill="none" stroke={design.checkColor??(design.variant==="CHECK"?safeColor:luminance > .179 ? "#172033" : "#fff")} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg></span>;
}
