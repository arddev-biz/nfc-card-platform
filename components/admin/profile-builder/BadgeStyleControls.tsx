"use client";
import type {z} from "zod";
import {useId,useState} from "react";
import {badgeDesign} from "@/lib/profile-visual";
import {badgeStyles,isFixedBadgeColor} from "@/lib/badge-styles";
import {VerificationBadge} from "@/components/profile/VerificationBadge";
import {PresetNumber} from "./PrecisionControls";
import {Field} from "./V2Controls";

export function BadgeStyleControls({value={},color="#2563EB",onChange,sizing=true}:{value?:z.infer<typeof badgeDesign>;color?:string;onChange:(value:z.infer<typeof badgeDesign>)=>void;sizing?:boolean}) {
 const selectId=useId(),[expanded,setExpanded]=useState(false);
 const selected=badgeStyles.find(style=>style.id===(value.variant??"CIRCLE"))!;
 return <div className="space-y-4" aria-label="Verification appearance">
  <div className="relative space-y-2" onKeyDown={event=>{if(event.key==="Escape")setExpanded(false)}}><p className="text-sm font-semibold">Badge style</p><button type="button" aria-label={`Badge style: ${selected.name}`} aria-expanded={expanded} aria-controls={selectId} className="flex w-full items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text)] hover:bg-[var(--admin-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)]" onClick={()=>setExpanded(!expanded)}><VerificationBadge decorative color={value.color??color} design={{variant:selected.id,size:32}}/><span className="flex-1 text-left">{selected.name}</span><span aria-hidden="true">{expanded?"▴":"▾"}</span></button>{expanded&&<div id={selectId} role="group" aria-label="Choose badge style" className="absolute left-0 right-0 z-30 grid max-h-80 grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-3 shadow-xl">{badgeStyles.map(style=><button key={style.id} type="button" aria-pressed={selected.id===style.id} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-[var(--admin-border)] p-2 text-center text-xs text-[var(--admin-text)] hover:bg-[var(--admin-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] aria-pressed:border-[var(--admin-accent)]" onClick={()=>{onChange({...value,variant:style.id});setExpanded(false)}}><VerificationBadge decorative color={value.color??color} design={{variant:style.id,size:32}}/><span>{style.name}</span></button>)}</div>}</div>
  {sizing&&<PresetNumber label="Badge size" value={value.size??24} min={16} max={40} presets={[{value:20,label:"Small"},{value:24,label:"Medium"},{value:32,label:"Large"}]} onChange={size=>onChange({...value,size})}/>}
  {isFixedBadgeColor(value.variant)?<p className="builder-v3-note">This artwork keeps its original colors.</p>:<Field label="Badge color" type="color" value={value.color??color} onChange={color=>onChange({...value,color})}/>}
  <p className="builder-v3-note">Appearance only. Choosing a style does not verify a business.</p>
 </div>;
}
