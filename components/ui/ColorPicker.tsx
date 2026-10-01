"use client";
import {useEffect,useState} from "react";
export function ColorPicker({label,value,onChange,allowEmpty=false}:{label:string;value:string;onChange:(value:string)=>void;allowEmpty?:boolean}) {
  const [hex,setHex]=useState(value);
  useEffect(()=>setHex(value),[value]);
  function change(next:string){setHex(next);if(/^#[\da-f]{6}$/i.test(next)||(allowEmpty&&next===""))onChange(next);}
  function commitHex(){if(/^#[\da-f]{3}$/i.test(hex)){const expanded="#"+[...hex.slice(1)].map(c=>c+c).join("");setHex(expanded);onChange(expanded);}}
  const invalid=!/^#[\da-f]{6}$/i.test(hex)&&!/^#[\da-f]{3}$/i.test(hex)&&!(allowEmpty&&hex==="");
  const valid=/^#[\da-f]{6}$/i.test(value)?value:/^#[\da-f]{3}$/i.test(value)?"#"+[...value.slice(1)].map(c=>c+c).join(""):"#4F46E5";
  return <fieldset className="space-y-2"><legend className="text-sm font-medium">{label}</legend><div className="flex items-center gap-3">
    <label className="text-xs">Pick color<input title="Open color picker" type="color" aria-label={`${label} visual picker`} value={valid} onChange={e=>change(e.target.value)} className="mt-1 block h-10 w-12 cursor-pointer rounded border border-[var(--admin-border)]"/></label>
    <label className="text-xs">HEX<input aria-label={`${label} HEX`} aria-invalid={invalid} value={hex} onChange={e=>change(e.target.value)} onBlur={commitHex} maxLength={7} className="mt-1 block w-28 rounded border border-[var(--admin-border)] bg-[var(--admin-input)] p-2 text-[var(--admin-text)]"/></label>
    {allowEmpty&&<button type="button" onClick={()=>change("")}>Default</button>}</div>
    {invalid&&<p role="alert" className="text-xs text-[var(--admin-danger,#dc2626)]">Enter a HEX color such as #FFFFFF or #FFF.</p>}
    <div aria-label="Color shortcuts" className="flex flex-wrap gap-2">{["#4F46E5","#2563EB","#16A34A","#DC2626","#F7F7F8","#303644"].map(color=><button key={color} type="button" aria-label={`${label} ${color}`} onClick={()=>change(color)} style={{background:color}} className="h-7 w-7 rounded-full border border-[var(--admin-border)]"/>)}</div>
  </fieldset>;
}
