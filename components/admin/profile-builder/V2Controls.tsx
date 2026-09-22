"use client";
import { Switch } from "@/components/ui/Switch";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { useState } from "react";
import { textConfig, mediaConfig } from "@/lib/profile-v2";
import { surfaceConfig } from "@/lib/profile-design";
const inputClass = "w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-2 text-[var(--admin-text)]";
export function Field({ label, value, onChange, multiline = false, type = "text" }: { label: string; value: string; onChange: (v:string)=>void; multiline?: boolean; type?: string }) {
  if(type==="color")return <ColorPicker label={label} value={value} onChange={onChange}/>;
  return <label className="block space-y-1 text-sm"><span>{label}</span>{multiline ? <textarea className={inputClass} value={value} onChange={e=>onChange(e.target.value)} rows={4} /> : <input type={type} className={inputClass} value={value} onChange={e=>onChange(e.target.value)} />}</label>;
}
export function Choice({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v:string)=>void }) {
  return <label className="block space-y-1 text-sm"><span>{label}</span><select className={inputClass} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o} value={o}>{o === "DIMENSIONAL" ? "3D" : o === "DEFAULT" ? "Theme default" : o.replaceAll("_"," ")}</option>)}</select></label>;
}
export function SurfaceControls({config,onChange}:{config:Record<string,unknown>;onChange:(v:Record<string,unknown>)=>void}) {
  const parsed=surfaceConfig.safeParse(config.surface), c=parsed.success?parsed.data:surfaceConfig.parse({});
  return <details className="rounded-lg border border-[var(--admin-border)] p-3"><summary className="cursor-pointer font-medium">Surface & spacing</summary><div className="mt-3 space-y-2">
    <Choice label="Surface preset" value={c.preset} options={["INHERIT","NONE","MINIMAL","CARD"]} onChange={preset=>onChange({...config,surface:{preset}})}/>
    {(["border","background","padding","shadow"] as const).map(key=><Choice key={key} label={key} value={c[key]===undefined?"PRESET":c[key]?"ON":"OFF"} options={["PRESET","ON","OFF"]} onChange={value=>{const surface={...c};if(value==="PRESET")delete surface[key];else surface[key]=value==="ON";onChange({...config,surface});}}/>)}
  </div></details>;
}
export function Toggle({ label, value, onChange }: { label:string; value:boolean; onChange:(v:boolean)=>void }) {
  return <div className="flex items-center gap-3 py-2 text-sm"><Switch label={label} checked={value} onChange={onChange}/><span>{label}</span></div>;
}
export function TextControls({ config, onChange }: { config:Record<string,unknown>; onChange:(v:Record<string,unknown>)=>void }) {
  const c = { ...textConfig.parse({}), ...config };
  return <div className="grid gap-3 sm:grid-cols-2">
    <Choice label="Alignment" value={String(c.align)} options={["LEFT","CENTER","RIGHT"]} onChange={align=>onChange({...config,align})} />
    <Choice label="Font size" value={String(c.size)} options={["SMALL","DEFAULT","LARGE"]} onChange={size=>onChange({...config,size})} />
    <Choice label="Weight" value={String(c.weight)} options={["REGULAR","MEDIUM","BOLD"]} onChange={weight=>onChange({...config,weight})} />
    <Choice label="Line height" value={String(c.lineHeight)} options={["TIGHT","NORMAL","RELAXED"]} onChange={lineHeight=>onChange({...config,lineHeight})}/>
    <Choice label="Letter spacing" value={String(c.letterSpacing)} options={["TIGHT","NORMAL","WIDE"]} onChange={letterSpacing=>onChange({...config,letterSpacing})}/>
    <Toggle label="Italic" value={Boolean(c.italic)} onChange={italic=>onChange({...config,italic})} />
    <Toggle label="Custom text color" value={!!c.color} onChange={enabled=>onChange({...config,color:enabled ? "#334155" : null})} />
    {c.color && <Field label="Text color" type="color" value={String(c.color)} onChange={color=>onChange({...config,color})} />}
  </div>;
}
export function MediaControls({ config,onChange,carousel }: {config:Record<string,unknown>;onChange:(v:Record<string,unknown>)=>void;carousel:boolean}) {
  const c = {...mediaConfig.parse({}),...config};
  return <div className="grid gap-3 sm:grid-cols-2">
    <Choice label="Aspect ratio" value={String(c.ratio)} options={["AUTO","SQUARE","PORTRAIT","LANDSCAPE"]} onChange={ratio=>onChange({...c,ratio})} />
    {carousel && <>
      <Choice label="Motion" value={String(c.mode)} options={["SLIDE","CONTINUOUS"]} onChange={mode=>onChange({...c,mode})} />
      <Choice label="Speed" value={String(c.speed)} options={["SLOW","NORMAL","FAST"]} onChange={speed=>onChange({...c,speed})} />
      {(["autoplay","loop","pagination","resume"] as const).map(key=><Toggle key={key} label={key === "resume" ? "Resume after 5 seconds inactivity" : key} value={Boolean(c[key])} onChange={value=>onChange({...c,[key]:value})} />)}
    </>}
  </div>;
}
export function Upload({ organizationId, label, onUploaded, multiple = false, disabled = false }: { organizationId:string;label:string;onUploaded:(asset:{id:string;url:string})=>Promise<void>;multiple?:boolean;disabled?:boolean }) {
  const [busy,setBusy]=useState(false), [error,setError]=useState("");
  return <label className="block space-y-2 text-sm">{label}<input aria-label={label} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} disabled={disabled||busy} className="block max-w-full"
    onChange={async e=>{
      const files=Array.from(e.target.files??[]);e.target.value="";setBusy(true);setError("");
      try { for(const file of files) {
        if(file.size>5*1024*1024) throw new Error("Maximum 5MB per image.");
        const body=new FormData();body.set("file",file);
        const r=await fetch(`/api/admin/businesses/${organizationId}/v2/assets`,{method:"POST",body});
        const data=await r.json();if(!r.ok)throw new Error(data.error);
        try { await onUploaded(data.asset); }
        catch(e) { await fetch(`/api/admin/businesses/${organizationId}/v2/assets?assetId=${encodeURIComponent(data.asset.id)}`,{method:"DELETE"}); throw e; }
      }} catch(err) {setError(err instanceof Error?err.message:"Upload failed.");} finally{setBusy(false);}
    }} />{busy&&<span role="status">Uploading…</span>}{error&&<span role="alert">{error}</span>}</label>;
}
