"use client";
export function VisualChoice({label,value,options,onChange}:{label:string;value:string;options:readonly {value:string;label:string}[];onChange:(value:string)=>void}) {
  return <fieldset className="space-y-2"><legend className="text-sm font-medium">{label}</legend><div className="flex flex-wrap gap-2">{options.map(option=><button type="button" key={option.value} aria-pressed={value===option.value} className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm aria-pressed:border-[var(--admin-accent)] aria-pressed:bg-[var(--admin-accent)]/10" onClick={()=>onChange(option.value)}>{option.label}</button>)}</div></fieldset>;
}
export function ExactNumber({label,value,min=0,max=100,onChange}:{label:string;value:number;min?:number;max?:number;onChange:(n:number)=>void}) {
  return <label className="flex items-center justify-between gap-4 text-sm">{label}<input aria-label={label} type="number" step="any" min={min} max={max} value={value} className="w-24 rounded-lg border bg-[var(--admin-bg)] p-2" onChange={e=>{const n=Number(e.target.value);if(e.target.value!==""&&Number.isFinite(n)&&n>=min&&n<=max)onChange(n);}}/></label>;
}
