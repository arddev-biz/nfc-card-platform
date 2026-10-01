"use client";
import {useState} from "react";
import {Field} from "./V2Controls";
import {VisualChoice,ExactNumber,ButtonStyle,TextAppearance} from "./VisualControls";
import {readVisual,type VisualText,type ProfileVisual,type VisualOverride} from "@/lib/profile-visual";
import type {V2Section} from "@/lib/profile-v2";

export function LinkAppearance({value,global,onChange}:{value:(VisualOverride&{subtitle?:string})|undefined;global:VisualOverride;onChange:(value:(VisualOverride&{subtitle?:string})|undefined)=>void}){
  const merged={...global,...value,surface:{...global.surface,...value?.surface},action:{...global.action,...value?.action},text:{...global.text,...value?.text}};
  const change=(next:VisualOverride)=>{const result={...value};for(const group of ["surface","action","text"] as const){const changes=Object.fromEntries(Object.entries(next[group]??{}).filter(([key,v])=>v!==(merged[group] as Record<string,unknown>)[key]));if(Object.keys(changes).length)result[group]={...value?.[group],...changes};}onChange(result)};
  return <details><summary className="cursor-pointer text-sm font-semibold">Button appearance</summary><div className="space-y-4 pt-3"><p className="builder-v3-note">Only changed properties override the section and Global Design.</p><ButtonStyle arrow={false} value={merged} onChange={change}/><details><summary className="cursor-pointer text-sm">Label typography</summary><div className="pt-3"><TextAppearance color={false} alignment={false} value={merged.text} onChange={text=>change({...merged,text})}/></div></details>{value&&(value.surface||value.action||value.text)&&<button type="button" onClick={()=>onChange(undefined)}>Reset item style to Theme / Global</button>}</div></details>;
}

export function EssentialText({value,onChange,font=false,role="body",color=true}:{value:VisualText;onChange:(value:VisualText)=>void;font?:boolean;role?:"name"|"heading"|"body";color?:boolean}){
  const sizes={name:[24,30,36],heading:[16,20,24],body:[14,16,18]}[role],size=value.size??sizes[1];
  return <div className="space-y-4">
    {font&&<VisualChoice label="Font" value={value.font??"SANS"} options={[{value:"SANS",label:"Modern"},{value:"SERIF",label:"Classic"},{value:"HUMANIST",label:"Friendly"},{value:"MONO",label:"Monospace"}]} onChange={font=>onChange({...value,font:font as VisualText["font"]})}/>}
    <VisualChoice label="Alignment" value={value.align??"LEFT"} options={[{value:"LEFT",label:"Left"},{value:"CENTER",label:"Center"},{value:"RIGHT",label:"Right"}]} onChange={align=>onChange({...value,align:align as VisualText["align"]})}/>
    <VisualChoice label="Text size" value={String(size<=sizes[0]?sizes[0]:size>=sizes[2]?sizes[2]:sizes[1])} options={sizes.map((value,index)=>({value:String(value),label:["Small","Standard","Large"][index]}))} onChange={size=>onChange({...value,size:Number(size)})}/>
    <details><summary className="cursor-pointer text-sm">Advanced text size</summary><div className="pt-3"><ExactNumber label="Text size" min={12} max={64} value={value.size??16} onChange={size=>onChange({...value,size})}/></div></details>
    <VisualChoice label="Weight" value={value.weight??"400"} options={[{value:"400",label:"Regular"},{value:"500",label:"Medium"},{value:"600",label:"Semibold"},{value:"700",label:"Bold"},{value:"800",label:"Heavy"}]} onChange={weight=>onChange({...value,weight:weight as VisualText["weight"]})}/>
    {color&&<Field type="color" label="Text color" value={value.color??"#172033"} onChange={color=>onChange({...value,color})}/>}
  </div>;
}

export function EssentialButtons({value,onChange}:{value:VisualOverride;onChange:(value:VisualOverride)=>void}){
  const surface=value.surface??{},action=value.action??{};
  return <div className="space-y-4">
    <VisualChoice label="Button style" value={surface.variant??"SOFT"} options={[{value:"TRANSPARENT",label:"No fill"},{value:"SOFT",label:"Clean"},{value:"SOLID",label:"Filled"},{value:"OUTLINE",label:"Outline"},{value:"GLASS",label:"Glass"}]} onChange={variant=>onChange({...value,surface:{...surface,variant:variant as typeof surface.variant,opacity:variant==="GLASS"?24:variant==="SOFT"?12:100}})}/>
    <Field type="color" label="Button / card color" value={surface.color??"#ffffff"} onChange={color=>onChange({...value,surface:{...surface,color}})}/>
    <Field type="color" label="Button text color" value={action.textColor??"#172033"} onChange={textColor=>onChange({...value,action:{...action,textColor}})}/>
    <VisualChoice label="Corners" value={String((surface.radius??16)===0?0:(surface.radius??16)<=8?8:(surface.radius??16)<=24?16:48)} options={[{value:"0",label:"Square"},{value:"8",label:"Soft"},{value:"16",label:"Rounded"},{value:"48",label:"Pill"}]} onChange={radius=>onChange({...value,surface:{...surface,radius:Number(radius)}})}/>
    <VisualChoice label="Height" value={String((action.minHeight??56)<=52?48:(action.minHeight??56)>=68?72:60)} options={[{value:"48",label:"Compact"},{value:"60",label:"Standard"},{value:"72",label:"Large"}]} onChange={height=>onChange({...value,action:{...action,minHeight:Number(height)}})}/>
  </div>;
}

export function EssentialSectionAppearance({section,global,onChange}:{section:V2Section;global:ProfileVisual;onChange:(section:V2Section)=>void}){
  const [customSpaceFor,setCustomSpaceFor]=useState<string|null>(null);
  const visual=readVisual(section.config.visual),customized=!!section.config.visual;
  const setVisual=(next:VisualOverride|undefined)=>onChange({...section,config:{...section.config,visual:next}});
  const patchGroup=<K extends keyof VisualOverride>(group:K,value:NonNullable<VisualOverride[K]>)=>setVisual({...visual,[group]:value});
  const globalButton:VisualOverride={surface:{...global.surface,...visual.surface},action:{...global.action,...visual.action}};
  const changeButtons=(next:VisualOverride)=>{const result={...visual};for(const group of ["surface","action"] as const){const changed=Object.fromEntries(Object.entries(next[group]??{}).filter(([key,value])=>value!==(globalButton[group] as Record<string,unknown>|undefined)?.[key]));if(Object.keys(changed).length)result[group]={...visual[group],...changed};}setVisual(result)};
  const isSocial=section.kind==="SOCIALS";
  const reset=()=>onChange({...section,config:{...section.config,visual:undefined,...(isSocial?{containerStyle:"ICON_ONLY",containerColor:null,iconColor:"INHERIT",shape:"CIRCLE",border:false,borderColor:null}:{})}});
  return <section className="builder-v3-card space-y-5"><div className="flex items-center justify-between gap-3"><h3>Appearance</h3>{customized&&<span className="builder-v3-override-badge">Section style</span>}</div><p className="builder-v3-note">Uses Global Design until you customize this section.</p>
    <label className="flex items-center gap-3"><input type="checkbox" checked={customized} onChange={event=>setVisual(event.target.checked?{}:undefined)}/>Customize this section</label>
    {customized&&<>
      {isSocial&&<>
        <VisualChoice label="Presentation" value={String(section.config.composition??"ICONS")} options={[{value:"ICONS",label:"Icons"},{value:"CARDS",label:"Button Cards"}]} onChange={composition=>onChange({...section,config:{...section.config,composition}})}/>
        <VisualChoice label="Icon container" value={String(section.config.containerStyle??"ICON_ONLY")} options={[{value:"ICON_ONLY",label:"No fill"},{value:"FILLED",label:"Filled"},{value:"BRANDED",label:"Brand colors"},{value:"OUTLINE",label:"Outline"}]} onChange={containerStyle=>onChange({...section,config:{...section.config,containerStyle}})}/>
        {["FILLED","OUTLINE"].includes(String(section.config.containerStyle))&&<Field type="color" label="Container color" value={String(section.config.containerColor??global.surface?.color??"#ffffff")} onChange={containerColor=>onChange({...section,config:{...section.config,containerColor}})}/>}
        {section.config.containerStyle==="BRANDED"&&section.config.composition!=="CARDS"?<p className="builder-v3-note">The platform background and a contrasting logo are applied automatically.</p>:<VisualChoice label="Icon color" value={String(section.config.iconColor??"INHERIT")} options={[{value:"INHERIT",label:"Use profile"},{value:"THEME",label:"Theme"},{value:"MONOCHROME",label:"Single color"},{value:"BRAND",label:"Brand colors"}]} onChange={iconColor=>{const action={...visual.action};if(iconColor!=="MONOCHROME")delete action.iconColor;onChange({...section,config:{...section.config,iconColor,visual:{...visual,action}}})}}/>}
        <VisualChoice label="Shape" value={String(section.config.shape??"CIRCLE")} options={[{value:"CIRCLE",label:"Circle"},{value:"ROUNDED",label:"Rounded"},{value:"SQUARE",label:"Square"}]} onChange={shape=>onChange({...section,config:{...section.config,shape}})}/>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={section.config.border===true} onChange={event=>onChange({...section,config:{...section.config,border:event.target.checked}})}/>Show border</label>
      </>}
      {!isSocial&&<p className="builder-v3-note">Shared section styling applies to the section container. Text, buttons and images are customized on their individual items.</p>}
      {isSocial&&(section.config.containerStyle!=="BRANDED"||section.config.composition==="CARDS")&&section.config.iconColor==="MONOCHROME"&&<Field type="color" label="Single icon color" value={visual.action?.iconColor??global.socials?.action?.iconColor??"#172033"} onChange={iconColor=>onChange({...section,config:{...section.config,iconColor:"MONOCHROME",visual:{...visual,action:{...visual.action,iconColor}}}})}/>}
      {isSocial&&section.config.border===true&&<Field type="color" label="Border color" value={String(section.config.borderColor??"#172033")} onChange={borderColor=>onChange({...section,config:{...section.config,borderColor}})}/>}
      {(section.singletonKey==="LINKS"||section.singletonKey==="BUSINESS_INFO"||isSocial&&section.config.composition==="CARDS")&&<EssentialButtons value={globalButton} onChange={changeButtons}/>}
      {section.kind==="CUSTOM"&&<><VisualChoice label="Section surface" value={visual.surface?.variant??"TRANSPARENT"} options={[{value:"TRANSPARENT",label:"None"},{value:"SOLID",label:"Filled"},{value:"GLASS",label:"Glass"},{value:"OUTLINE",label:"Outline"}]} onChange={variant=>patchGroup("surface",{...visual.surface,variant:variant as NonNullable<VisualOverride["surface"]>["variant"]})}/>{visual.surface?.variant&&visual.surface.variant!=="TRANSPARENT"&&<Field type="color" label="Section background" value={visual.surface?.color??global.surface?.color??"#ffffff"} onChange={color=>patchGroup("surface",{...visual.surface,color})}/>}</>}
      {isSocial&&<div className="space-y-3"><h4 className="text-sm font-semibold">Spacing</h4><VisualChoice label="Space above" value={customSpaceFor===section.id||visual.layout?.before!==undefined&&![0,8,16,24].includes(visual.layout.before)?"CUSTOM":visual.layout?.before===undefined?"INHERIT":String(visual.layout.before)} options={[{value:"0",label:"None"},{value:"8",label:"Small"},{value:"16",label:"Medium"},{value:"24",label:"Large"},{value:"CUSTOM",label:"Custom"}]} onChange={before=>{setCustomSpaceFor(before==="CUSTOM"?section.id:null);if(before!=="CUSTOM")patchGroup("layout",{...visual.layout,before:Number(before)})}}/>{(customSpaceFor===section.id||visual.layout?.before!==undefined&&![0,8,16,24].includes(visual.layout.before))&&<ExactNumber label="Custom space above" min={0} max={80} value={visual.layout?.before??0} onChange={before=>patchGroup("layout",{...visual.layout,before})}/>}<p className="builder-v3-note">Space before this section only. Header inside spacing is unchanged.</p></div>}
      <VisualChoice label={isSocial?"Icon gap":"Spacing"} value={String(visual.layout?.gap??(isSocial?{COMPACT:2,COMFORTABLE:16,SPACIOUS:24}[String(section.config.spacing??"COMFORTABLE") as "COMPACT"|"COMFORTABLE"|"SPACIOUS"]:16))} options={isSocial?[{value:"2",label:"Compact"},{value:"8",label:"Small"},{value:"16",label:"Balanced"},{value:"24",label:"Relaxed"}]:[{value:"8",label:"Compact"},{value:"16",label:"Balanced"},{value:"24",label:"Relaxed"}]} onChange={gap=>patchGroup("layout",{...visual.layout,gap:Number(gap)})}/>
      {isSocial&&<VisualChoice label="Social icon size" value={String(section.config.iconSize??"INHERIT")} options={[{value:"INHERIT",label:"Use theme"},{value:"SMALL",label:"Small"},{value:"MEDIUM",label:"Medium"},{value:"LARGE",label:"Large"}]} onChange={iconSize=>onChange({...section,config:{...section.config,iconSize:iconSize==="INHERIT"?undefined:iconSize}})}/>}
      <div className="flex flex-wrap gap-3"><button type="button" onClick={reset}>Reset to Global</button></div>
    </>}
  </section>;
}
