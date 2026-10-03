"use client";
import {useState} from "react";
import {VisualChoice,ExactNumber} from "./VisualFields";

/** Presets remain easy; unusual saved values are never rounded to a preset. */
export function PresetNumber({label,value,presets,min=0,max=100,onChange}:{label:string;value:number;presets:readonly {value:number;label:string}[];min?:number;max?:number;onChange:(value:number)=>void}){
 const [custom,setCustom]=useState(false);
 const exact=custom||!presets.some(p=>p.value===value);
 return <div className="space-y-3"><VisualChoice label={label} value={exact?"CUSTOM":String(value)} options={[...presets.map(p=>({...p,value:String(p.value)})),{value:"CUSTOM",label:"Custom"}]} onChange={next=>{setCustom(next==="CUSTOM");if(next!=="CUSTOM")onChange(Number(next))}}/>{exact&&<details open={custom}><summary className="cursor-pointer text-sm">Custom {label.toLowerCase()}</summary><div className="pt-2"><ExactNumber label={label} value={value} min={min} max={max} onChange={onChange}/></div></details>}</div>;
}
