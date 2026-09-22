"use client";
import {useRef,useEffect,type ReactNode} from "react";
/** Exclusivity applies only to explicitly marked three-dot overflow menus. */
export function DisclosureScope({children}:{children:ReactNode}) {
  const root=useRef<HTMLDivElement>(null);
  const close=(except?:Element)=>root.current?.querySelectorAll("details[data-overflow-menu][open]").forEach(node=>{if(node!==except&&!node.contains(except??null))node.removeAttribute("open");});
  useEffect(()=>{if(typeof document==="undefined")return;const outside=(event:PointerEvent)=>{if(root.current&&!root.current.contains(event.target as Node))root.current.querySelectorAll("details[data-overflow-menu][open]").forEach(node=>node.removeAttribute("open"));};document.addEventListener("pointerdown",outside);return()=>document.removeEventListener("pointerdown",outside);},[]);
  useEffect(()=>{const scope=root.current;if(!scope)return;const toggle=(event:Event)=>{const target=event.target;if(target instanceof HTMLDetailsElement&&target.open&&target.hasAttribute("data-overflow-menu"))scope.querySelectorAll("details[data-overflow-menu][open]").forEach(node=>{if(node!==target&&!node.contains(target))node.removeAttribute("open");});};scope.addEventListener("toggle",toggle,true);return()=>scope.removeEventListener("toggle",toggle,true);},[]);
  return <div ref={root} onPointerDownCapture={event=>{const target=event.target as HTMLElement;const details=target.closest("details[data-overflow-menu]");if(!details)close();else close(details);}} onKeyDownCapture={event=>{if(event.key==="Escape"){const open=root.current?.querySelector<HTMLDetailsElement>("details[data-overflow-menu][open]");close();open?.querySelector<HTMLElement>("summary")?.focus();}}}>{children}</div>;
}
