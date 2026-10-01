"use client";
import {useRef,type ReactNode,type CSSProperties} from "react";
export function VisualCollection({children,className,style,"data-layout":mode}:{children:ReactNode;className?:string;style?:CSSProperties;"data-layout"?:string}) {
  const track=useRef<HTMLDivElement>(null);
  const move=(direction:number)=>track.current?.scrollBy({left:direction*track.current.clientWidth,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  return <><div ref={track} className={className} style={style} data-layout={mode} tabIndex={mode==="CAROUSEL"?0:undefined} aria-label={mode==="CAROUSEL"?"Content carousel":undefined}>{children}</div>{mode==="CAROUSEL"&&<div className="mt-3 flex justify-between gap-3"><button type="button" onClick={()=>move(-1)} aria-label="Previous card">← Previous</button><button type="button" onClick={()=>move(1)} aria-label="Next card">Next →</button></div>}</>;
}
