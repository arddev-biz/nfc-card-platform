import type { ReactNode } from "react";
import { actionCSS, surfaceCSS, textCSS, roleTextCSS, type VisualOverride, type ProfileVisual } from "@/lib/profile-visual";

export function VisualAction({href,label,subtitle,icon,visual,typography,external,download}: {
  href:string;label:string;subtitle?:string;icon:ReactNode;visual:VisualOverride;
  typography?:ProfileVisual["typography"];external?:boolean;download?:string;
}) {
  const a=visual.action;
  return <a className="v2-surface v2-action flex h-full items-center gap-3" href={href} aria-label={label}
    target={external?"_blank":undefined} rel="noopener noreferrer" download={download}
    style={{...surfaceCSS({variant:"SOLID",radius:16,...visual.surface}),...roleTextCSS(typography,"label"),...textCSS(visual.text),...actionCSS({minHeight:56,padding:14,...a})}}>
    {icon&&a?.iconPosition!=="NONE"&&<span className="visual-action-icon" style={{width:a?.iconContainerSize??a?.iconSize??24,minWidth:a?.iconContainerSize??a?.iconSize??24,height:a?.iconContainerSize??a?.iconSize??24,borderRadius:a?.iconRadius,color:a?.iconColor,background:a?.iconBackground,padding:a?.iconPosition==="TILE"?8:undefined}}>{icon}</span>}
    <span className="visual-action-copy"><span className="block">{label}</span>{subtitle&&<span className="mt-1 block" style={{...roleTextCSS(typography,"caption"),color:a?.secondaryColor??typography?.caption?.color}}>{subtitle}</span>}</span>
    {a?.chevron&&<svg aria-hidden="true" className="ml-auto shrink-0" width={a.chevronSize??18} height={a.chevronSize??18} viewBox="0 0 24 24" fill="none" style={{color:a.chevronColor}}><path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
  </a>;
}
