"use client";
export function Switch({label,checked,onChange,disabled=false}:{label:string;checked:boolean;onChange:(value:boolean)=>void;disabled?:boolean}) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} disabled={disabled} onClick={()=>onChange(!checked)} className="admin-switch" data-checked={checked}><span aria-hidden="true"/></button>;
}
