"use client";
import {useState} from "react";
import type {ProfileVisual} from "@/lib/profile-visual";
import {Field} from "./V2Controls";
import {VisualChoice,ExactNumber} from "./VisualFields";
type Hero=NonNullable<ProfileVisual["hero"]>;
export const coverTreatments={ORIGINAL:{overlayOpacity:0,fade:0},SUBTLE:{overlayOpacity:12,fade:15},BALANCED:{overlayOpacity:25,fade:35},STRONG:{overlayOpacity:40,fade:65}} as const;
export function effectiveCoverShading(hero:Hero){return hero.overlayOpacity??(hero.composition==="IMAGE_HERO"||hero.identityPosition==="OVER_IMAGE"?40:0)}
export function HeaderDetails({hero,onChange}:{hero:Hero;onChange:(next:Partial<Hero>)=>void}){
 const cover=!["CENTERED","MINIMAL"].includes(hero.composition??"COVER_OVERLAP");
 const [customPosition,setCustomPosition]=useState(false),[customTreatment,setCustomTreatment]=useState(false);
 const shading=effectiveCoverShading(hero),fade=hero.fade??0;
 const preset=Object.entries(coverTreatments).find(([,v])=>v.overlayOpacity===shading&&v.fade===fade&&(!hero.overlayColor||hero.overlayColor.toLowerCase()==="#000000"))?.[0]??"CUSTOM";
 return <div className="space-y-4">
 {cover&&<section className="space-y-3"><h3 className="font-semibold">Cover treatment</h3>
 <VisualChoice label="Treatment" value={customTreatment?"CUSTOM":preset} options={[{value:"ORIGINAL",label:"Original"},{value:"SUBTLE",label:"Subtle"},{value:"BALANCED",label:"Balanced"},{value:"STRONG",label:"Strong"},{value:"CUSTOM",label:"Custom"}]} onChange={next=>{setCustomTreatment(next==="CUSTOM");if(next!=="CUSTOM")onChange({...coverTreatments[next as keyof typeof coverTreatments],overlayColor:"#000000"})}}/>
 <p className="builder-v3-note">Original removes shading and fade. Crop and image optimization still apply.</p>
 {shading===0&&fade===0&&(hero.composition==="IMAGE_HERO"||hero.identityPosition==="OVER_IMAGE")&&<p role="status" className="builder-v3-note">Check that your name and logo remain readable over the original photo. Choose Subtle or Balanced if needed.</p>}
 {(customTreatment||preset==="CUSTOM")&&<details open={customTreatment}><summary className="cursor-pointer text-sm">Custom cover treatment</summary><div className="space-y-3"><ExactNumber label="Shading strength" value={shading} max={90} onChange={overlayOpacity=>onChange({overlayOpacity})}/><Field label="Shading color" type="color" value={hero.overlayColor??"#000000"} onChange={overlayColor=>onChange({overlayColor})}/><ExactNumber label="Fade strength" value={fade} max={100} onChange={fade=>onChange({fade})}/></div></details>}
 <VisualChoice label="Cover position" value={customPosition||(hero.focalX??50)!==50||![0,50,100].includes(hero.focalY??50)?"CUSTOM":String(hero.focalY??50)} options={[{value:"0",label:"Top"},{value:"50",label:"Center"},{value:"100",label:"Bottom"},{value:"CUSTOM",label:"Custom position"}]} onChange={next=>{setCustomPosition(next==="CUSTOM");if(next!=="CUSTOM")onChange({focalX:50,focalY:Number(next)})}}/>
 {(customPosition||(hero.focalX??50)!==50||![0,50,100].includes(hero.focalY??50))&&<details open={customPosition}><summary className="cursor-pointer text-sm">Custom cover position</summary><ExactNumber label="Horizontal position" value={hero.focalX??50} onChange={focalX=>onChange({focalX})}/><ExactNumber label="Vertical position" value={hero.focalY??50} onChange={focalY=>onChange({focalY})}/></details>}
 <details><summary className="cursor-pointer text-sm">Advanced cover settings</summary><VisualChoice label="Cover fit" value={hero.fit??"COVER"} options={[{value:"COVER",label:"Fill cover"},{value:"CONTAIN",label:"Show whole photo"}]} onChange={fit=>onChange({fit:fit as "COVER"|"CONTAIN"})}/>
 {hero.composition!=="IMAGE_HERO"&&<VisualChoice label="Identity position" value={hero.identityPosition??"BELOW"} options={[{value:"BELOW",label:"Below cover"},{value:"OVER_IMAGE",label:"Over cover"}]} onChange={identityPosition=>onChange({identityPosition:identityPosition as "BELOW"|"OVER_IMAGE"})}/>}
 <ExactNumber label="Cover height" value={hero.mobileHeight??hero.height??240} min={80} max={500} onChange={height=>onChange({height,mobileHeight:height})}/>
 {hero.identityPosition!=="OVER_IMAGE"&&hero.composition!=="IMAGE_HERO"&&<ExactNumber label="Logo overlap" value={hero.overlap??(hero.composition==="COVER_OVERLAP"?48:0)} max={120} onChange={overlap=>onChange({overlap})}/>}
 </details></section>}
 <details><summary className="cursor-pointer text-sm">Logo shadow</summary><VisualChoice label="Logo shadow" value={hero.avatarShadow??"SOFT"} options={[{value:"NONE",label:"None"},{value:"SOFT",label:"Soft"},{value:"LIFTED",label:"Elevated"}]} onChange={avatarShadow=>onChange({avatarShadow:avatarShadow as Hero["avatarShadow"]})}/></details>
 </div>;
}
