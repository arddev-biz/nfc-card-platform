"use client";
import {BackgroundEditor} from "./BackgroundEditor";
import type {ProfileVisual} from "@/lib/profile-visual";
import {editableVisual,type ProfileDesign} from "@/lib/profile-design";
import {Field} from "./V2Controls";
import {VisualChoice} from "./VisualControls";
import {EssentialButtons,EssentialText} from "./EssentialAppearance";
import type {CustomTheme} from "@/lib/custom-themes";
import {CustomThemeControls} from "./CustomThemeControls";


type Props={customThemes?:CustomTheme[];isSuperAdmin?:boolean;design:ProfileDesign;onChange:(design:ProfileDesign)=>void;onPresetSelected?:(name:string)=>void;presetName?:string|null;customized?:boolean;organizationId:string;backgroundUrl:string|null;coverUrl:string|null;onBackgroundChange:(url:string|null)=>void;accent:string;onAccentChange:(color:string)=>void};
export function EssentialDesignEditor({customThemes=[],isSuperAdmin=false,design,onChange,onPresetSelected,presetName,customized,organizationId,backgroundUrl,coverUrl,onBackgroundChange,accent,onAccentChange}:Props){
  const visual=editableVisual(design),canvas=visual.canvas??{};
  const patch=(next:Partial<ProfileVisual>)=>onChange({...design,visual:{...visual,...next}});
  return <><div className="builder-v3-editor-heading"><span><h2>Design</h2><p>Choose the overall look of your profile.</p></span></div>
    <section className="builder-v3-card"><h3>Themes</h3><p>Pick a starting look. Your content stays the same.</p><CustomThemeControls design={design} accent={accent} onChange={onChange} onAccentChange={onAccentChange} themes={customThemes} isSuperAdmin={isSuperAdmin} presetName={presetName}/></section>
    <BackgroundEditor design={design} onChange={onChange} organizationId={organizationId} backgroundUrl={backgroundUrl} coverUrl={coverUrl} onBackgroundChange={onBackgroundChange}/>
    <section className="builder-v3-card space-y-4"><h3>Colors</h3><Field type="color" label="Primary / accent color" value={accent||"#4f46e5"} onChange={onAccentChange}/><Field type="color" label="Body text color" value={visual.typography?.body?.color??"#172033"} onChange={color=>patch({typography:{...visual.typography,body:{...visual.typography?.body,color}}})}/></section>
    <section className="builder-v3-card space-y-4"><h3>Typography</h3>{(["name","heading","body"] as const).map(scope=><details key={scope}><summary className="cursor-pointer font-semibold">{scope==="name"?"Display name":scope==="heading"?"Headings":"Body text"}</summary><div className="pt-4"><EssentialText font role={scope} color={scope!=="body"} value={visual.typography?.[scope]??(scope==="name"?{size:30,weight:"700",align:"CENTER"}:{})} onChange={value=>patch({typography:{...visual.typography,[scope]:value},...(scope==="name"&&value.align?{hero:{...visual.hero,align:value.align}}:{})})}/>{scope==="body"&&<p className="builder-v3-note">Body text color is managed in Colors.</p>}</div></details>)}</section>
    <section className="builder-v3-card space-y-4"><h3>Buttons &amp; Cards</h3><EssentialButtons value={{surface:visual.surface,action:visual.action}} onChange={next=>patch({surface:next.surface,action:next.action})}/><details className="pt-3"><summary className="cursor-pointer text-sm font-semibold">Advanced</summary><div className="mt-3"><VisualChoice label="Hover" value={design.hoverStyle??"SOFT_LIFT"} options={[{value:"NONE",label:"None"},{value:"SOFT_LIFT",label:"Lift"},{value:"GLOW",label:"Glow"},{value:"SCALE",label:"Scale"},{value:"BRIGHTEN",label:"Brighten"}]} onChange={hoverStyle=>onChange({...design,hoverStyle:hoverStyle as ProfileDesign["hoverStyle"]})}/>{design.hoverStyle&&!['NONE','SOFT_LIFT','GLOW','SCALE','BRIGHTEN'].includes(design.hoverStyle)&&<p className="builder-v3-note">Your saved {design.hoverStyle.toLowerCase().replaceAll('_',' ')} effect is preserved until you choose another.</p>}</div></details></section>
    <section className="builder-v3-card"><VisualChoice label="Global spacing" value={(canvas.gap??16)<=10?"COMPACT":(canvas.gap??16)>=24?"SPACIOUS":"COMFORTABLE"} options={[{value:"COMPACT",label:"Compact"},{value:"COMFORTABLE",label:"Balanced"},{value:"SPACIOUS",label:"Relaxed"}]} onChange={density=>{const next=density as ProfileDesign["density"],gap={COMPACT:10,COMFORTABLE:16,SPACIOUS:24}[next];onChange({...design,density:next,visual:{...visual,canvas:{...canvas,gap}}})}}/><p className="builder-v3-note">Space between sections. Header and button sizing stay unchanged.</p></section>
  </>;
}
