"use client";
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from "react";
import {socialConfig} from "@/lib/profile-v2";
import {resolveIconSemantic,socialBrandPalette,isLightSocialFill,type SocialBrand} from "@/lib/profile-icons";
export function SocialIconSurface({config,children,network,type="CUSTOM",destination}:{config:unknown;children:ReactNode;network?:string|null;type?:string;destination?:string}) {
  const parsed=socialConfig.safeParse(config),c=parsed.success?parsed.data:socialConfig.parse({});
  const brand=c.containerStyle==="BRANDED"?socialBrandPalette[resolveIconSemantic(type,network,destination) as SocialBrand]:undefined;
  const ref=useRef<HTMLSpanElement>(null);
  const [light,setLight]=useState(c.containerStyle==="FILLED"&&isLightSocialFill(c.containerColor??""));
  useEffect(()=>{
   const el=ref.current;if(!el)return;
   const refresh=()=>setLight(c.containerStyle==="FILLED"&&isLightSocialFill(getComputedStyle(el).backgroundColor));
   refresh();const observer=new MutationObserver(refresh),root=el.closest(".profile-v2");
   if(root)observer.observe(root,{attributes:true});
   return()=>observer.disconnect();
  },[c.containerStyle,c.containerColor]);
  return <span ref={ref} className="social-icon-surface" data-style={c.containerStyle} data-light-fill={light||undefined} data-shape={c.shape} data-border={c.border||c.containerStyle==="OUTLINE"} style={{"--social-surface":brand?.background??c.containerColor??"var(--v2-surface)","--social-border":c.borderColor??"var(--v2-border)",color:brand?.foreground} as CSSProperties}>{children}</span>;
}
