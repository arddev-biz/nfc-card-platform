"use client";
import {useEffect,useRef,useState} from "react";
import {appearanceSignature,sectionHasStyleOverride,applyCustomTheme,applyThemeSections,readCustomTheme,snapshotCurrentDesign,type CustomTheme} from "@/lib/custom-themes";
import type {V2Section} from "@/lib/profile-v2";
import type {ProfileDesign} from "@/lib/profile-design";
import {ThemeThumbnail} from "./ThemeThumbnail";
import {starterThemeId,libraryThemeOrder} from "@/lib/starter-theme-library";
type Operation={action:"CREATE"}|{action:"METADATA"|"DESIGN"|"DELETE";theme:CustomTheme};
export function CustomThemeControls({design,accent,onChange,onAccentChange,themes,isSuperAdmin=false,presetName,sections,onSectionsChange,onThemesChange}:{design:ProfileDesign;accent:string;onChange:(d:ProfileDesign)=>void;onAccentChange:(color:string)=>void;themes:CustomTheme[];isSuperAdmin?:boolean;presetName?:string|null;sections?:V2Section[];onSectionsChange?:(sections:V2Section[])=>void;onThemesChange?:(themes:CustomTheme[])=>void}){
 const [catalog,setCatalog]=useState(themes),[name,setName]=useState(""),[description,setDescription]=useState(""),[error,setError]=useState(""),[saving,setSaving]=useState(false),[operation,setOperation]=useState<Operation>({action:"CREATE"});
 const dialog=useRef<HTMLDialogElement>(null),load=useRef<AbortController>();
 useEffect(()=>{onThemesChange?.(catalog)},[catalog,onThemesChange]);
 useEffect(()=>{const controller=new AbortController();load.current=controller;void(async()=>{try{const r=await fetch("/api/admin/custom-themes",{signal:controller.signal});if(r?.ok){const data=await r.json();if(!controller.signal.aborted)setCatalog(data.themes.map(readCustomTheme));}}catch{/* Preserve the server-provided catalog if refresh is unavailable. */}})();return()=>controller.abort()},[]);
 const selectedId=design.customThemeId??starterThemeId(presetName);
 const selected=catalog.find(t=>t.id===selectedId);
 const ordered=[...catalog].sort((a,b)=>libraryThemeOrder(a.id)-libraryThemeOrder(b.id));
 let snapshot:ReturnType<typeof snapshotCurrentDesign>|undefined;
 try{snapshot=snapshotCurrentDesign(design,accent||null,sections)}catch{/* Keep legacy content untouched. */}
 const expected=selected?snapshotCurrentDesign(applyCustomTheme(design,selected.design),selected.design.accentColor,sections?applyThemeSections(sections,selected.design):undefined):undefined;
 const customized=selected&&(appearanceSignature(snapshot)!==appearanceSignature(expected)||sections?.some(section=>sectionHasStyleOverride(section,selected.design)));
 const customLinks=new Set(sections?.flatMap(section=>Object.entries((section.config.linkStyles??{}) as Record<string,Record<string,unknown>>).filter(([,style])=>Object.keys(style).some(key=>key!=="subtitle")).map(([id])=>id))??[]);
 const customItems=sections?.reduce((count,section)=>count+section.items.filter(item=>!!item.config.visual||!!item.config.surface).length,0)??0;
 const itemOverrides=customLinks.size+customItems>0;
 const apply=(theme:CustomTheme,reset=false)=>{onChange({...applyCustomTheme(design,theme.design),customThemeId:theme.id});if(sections)onSectionsChange?.(applyThemeSections(sections,theme.design,reset));onAccentChange(theme.design.accentColor??"")};
 function open(next:Operation){setOperation(next);setName(next.action==="METADATA"?next.theme.name:"");setDescription(next.action==="METADATA"?next.theme.description??"":"");setError("");dialog.current?.showModal()}
 async function save(){
  if(saving||((operation.action==="CREATE"||operation.action==="DESIGN")&&!snapshot))return;
  load.current?.abort();setSaving(true);setError("");
  try{
   const endpoint=operation.action==="CREATE"?"/api/admin/custom-themes":`/api/admin/custom-themes/${operation.theme.id}`;
   const body=operation.action==="CREATE"?{name,description,design:snapshot}:operation.action==="METADATA"?{action:"METADATA",name,description}:operation.action==="DESIGN"?{action:"DESIGN",design:snapshot}:undefined;
   const response=await fetch(endpoint,{method:operation.action==="CREATE"?"POST":operation.action==="DELETE"?"DELETE":"PATCH",headers:{"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to change theme.");
   if(operation.action==="DELETE"){const id=operation.theme.id;setCatalog(previous=>previous.filter(t=>t.id!==id))}else{const theme=readCustomTheme(result.theme);setCatalog(previous=>[theme,...previous.filter(t=>t.id!==theme.id)])}
   dialog.current?.close();
  }catch(e){setError(e instanceof Error?e.message:"Unable to change theme.")}finally{setSaving(false)}
 }
 const metadata=operation.action==="CREATE"||operation.action==="METADATA",capture=operation.action==="CREATE"||operation.action==="DESIGN";
 const title=operation.action==="CREATE"?"Save current design as theme":operation.action==="METADATA"?"Edit theme details":operation.action==="DESIGN"?"Update from current design":"Delete theme";
 return <div className="space-y-3">
  {selected&&<p className="builder-v3-override-badge">Based on {selected.name}{customized?" · Customized":""}</p>}
  {itemOverrides&&<p className="builder-v3-note">{customLinks.size>0?`${customLinks.size} ${customLinks.size===1?"link keeps its":"links keep their"} custom appearance`:""}{customLinks.size>0&&customItems>0?". ":""}{customItems>0?`${customItems} ${customItems===1?"content item keeps its":"content items keep their"} custom appearance`:""} when you apply a theme.</p>}
  <details><summary className="cursor-pointer text-sm">Theme apply and reset</summary><p className="builder-v3-note">Applying a theme replaces global and section styling. Individual item styles are kept. Reset also removes individual item styles. Content and photos stay unchanged.</p>{itemOverrides&&<p className="builder-v3-note">Individual item styles override this theme. Open the selected item appearance to change it, or Reset design to remove all item styling.</p>}</details>
  {selectedId&&!selected&&<p className="builder-v3-note">The original theme is unavailable. Your saved design is preserved.</p>}
  {!catalog.length&&<p className="builder-v3-note">No themes available yet.</p>}
  <div className="builder-v3-themes">{ordered.map(theme=><div key={theme.id} className="relative min-w-0"><button type="button" title={theme.description??undefined} aria-pressed={selected?.id===theme.id} onClick={()=>apply(theme)} className="w-full"><ThemeThumbnail visual={theme.design.visual}/><strong>{theme.name}</strong></button><details className="builder-v3-more" style={{position:"absolute",right:4,top:4}}><summary aria-label={`Theme actions for ${theme.name}`} className="rounded bg-[var(--admin-card)] px-2">⋯</summary><div>{["Apply",...(isSuperAdmin?["Rename / details","Update from current design","Delete"]:[])].map(action=><button type="button" key={action} onClick={e=>{e.currentTarget.closest("details")?.removeAttribute("open");if(action==="Apply")apply(theme);else open({action:action==="Rename / details"?"METADATA":action==="Delete"?"DELETE":"DESIGN",theme})}}>{action}</button>)}</div></details></div>)}{isSuperAdmin&&<button type="button" aria-label="Save current design as theme" className="flex min-h-[130px] w-full flex-col items-center justify-center hover:bg-[var(--admin-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{borderStyle:"dashed",textAlign:"center"}} onClick={()=>open({action:"CREATE"})}><span aria-hidden="true" className="grid h-24 place-items-center text-4xl">+</span><strong>Save current design</strong></button>}</div>
  {selected&&(customized||itemOverrides)&&<button type="button" className="text-sm" onClick={()=>apply(selected,true)}>Reset design to {selected.name}</button>}
  {isSuperAdmin&&<dialog ref={dialog} aria-label={title} className="w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 text-[var(--admin-text)] shadow-xl backdrop:bg-black/40" onCancel={e=>{if(saving)e.preventDefault()}}><form className="space-y-4" onSubmit={e=>{e.preventDefault();void save()}}>
   <h3 className="text-lg font-semibold">{title}</h3>
   {operation.action==="CREATE"&&<p className="text-sm text-[var(--admin-text-secondary)]">Copies your current design and Links/Socials appearance, including unsaved edits. Business content, photos, visibility and individual item styles are not copied. Your profile is not saved.</p>}
   {operation.action==="DESIGN"&&<p className="text-sm text-[var(--admin-text-secondary)]">Replace the reusable design of {operation.theme.name} with your current design? Existing profiles keep their appearance. Future Apply and Reset to Theme use this updated design. Your profile is not saved.</p>}
   {operation.action==="DELETE"&&<p className="text-sm text-[var(--admin-text-secondary)]">Delete {operation.theme.name}? Existing profiles keep their appearance, but Reset to this theme will no longer be available. This cannot be undone.</p>}
   {capture&&(snapshot?<ThemeThumbnail visual={snapshot.visual}/>:<p role="alert">Choose a supported background before saving this theme.</p>)}
   {capture&&snapshot?.visual.canvas?.background==="IMAGE"&&<p className="text-sm text-[var(--admin-text-secondary)]">Photo placement is reusable; each profile keeps its own photo.</p>}
   {capture&&snapshot?.visual.canvas?.background==="EXISTING"&&<p className="text-sm text-[var(--admin-text-secondary)]">This layered background keeps its existing named recipe; future recipe tuning can affect it.</p>}
   {metadata&&<><label className="block text-sm">Theme name<input autoFocus required maxLength={80} value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input)] p-2 text-[var(--admin-text)]"/></label><label className="block text-sm">Description (optional)<textarea maxLength={200} value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input)] p-2 text-[var(--admin-text)]"/></label></>}
   {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
   <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={()=>dialog.current?.close()}>Cancel</button><button type="submit" disabled={saving||(capture&&!snapshot)||(metadata&&!name.trim())} className={`rounded-lg px-4 py-2 text-white disabled:opacity-50 ${operation.action==="DELETE"?"bg-red-700":"bg-emerald-700"}`}>{saving?"Saving…":operation.action==="DELETE"?"Delete Theme":operation.action==="DESIGN"?"Update Theme":operation.action==="METADATA"?"Save Details":"Save Theme"}</button></div>
  </form></dialog>}
 </div>;
}
