"use client";
import {ProfileVisualControls,FooterVisualControls} from "./VisualControls";
import {footerVisual} from "@/lib/profile-visual";
import type {ReactNode} from "react";
import {Choice,Field,Toggle} from "./V2Controls";
import {ColorPicker} from "@/components/ui/ColorPicker";
import {Button} from "@/components/ui/Button";
import {hoverStyles,resolveProfileDesign,type ProfileDesign} from "@/lib/profile-design";
import {brandingCapabilities} from "@/lib/branding";
export function DesignControlGroup({title,children}:{title:string;children:ReactNode}) {
  return <section className="space-y-3 border-b border-[var(--admin-border)] pb-4"><h3 className="py-2 font-semibold">{title}</h3><div className="space-y-3">{children}</div></section>;
}
type Props={value:ProfileDesign|undefined;theme:string;onChange:(value:ProfileDesign)=>void};
export function GlobalDesignControls({value,theme,onChange,backgroundImageControl,primaryColor="",onPrimaryColorChange=()=>undefined}:{value:ProfileDesign|undefined;theme:string;onChange:(value:ProfileDesign)=>void;backgroundImageControl?:ReactNode;primaryColor?:string;onPrimaryColorChange?:(value:string)=>void}) {
  const c=value??resolveProfileDesign(undefined,theme);
  return <div className="space-y-5 mb-5" aria-label="Global design">
    <ProfileVisualControls value={c} onChange={onChange} backgroundImageControl={backgroundImageControl}/>
    <DesignControlGroup title="Colors">
      <ColorPicker label="Primary color" value={primaryColor||"#4f46e5"} onChange={onPrimaryColorChange}/>
      <Toggle label="Use primary color for profile accents" value={c.accentEnabled!==false} onChange={accentEnabled=>onChange({...c,accentEnabled})}/>
    </DesignControlGroup>
  </div>;
}
export function FooterEditor({value,theme,onChange,role,premium=false,showPolicy=true,tab,appearanceDefault,appearanceSource,appearanceResetUnavailable=false}:Props&{role:string;premium?:boolean;showPolicy?:boolean;tab?:"content"|"appearance";appearanceDefault?:Record<string,unknown>;appearanceSource?:string;appearanceResetUnavailable?:boolean}) {
  const c=value??resolveProfileDesign(undefined,theme),allowed=brandingCapabilities(role,premium).customizeFooter;
  return <fieldset disabled={!allowed} className="space-y-4" aria-label="Footer editor"><legend className="text-lg font-semibold">Footer</legend>
    {showPolicy&&<p className="text-sm">{role==="SUPER_ADMIN"?"Super Admin can configure branding for every business.":"Custom branding requires an eligible subscription."}</p>}
    {tab!=="appearance"&&<><Toggle label={showPolicy?"Hide platform branding":"Hide footer"} value={c.footer?.hidden??false} onChange={hidden=>onChange({...c,footer:{...c.footer,text:c.footer?.text??"",hidden}})}/>
    <Field label="Footer text (blank uses platform name)" value={c.footer?.text??""} onChange={text=>onChange({...c,footer:{...c.footer,hidden:c.footer?.hidden??false,text}})}/>
    </>}{tab!=="content"&&<FooterVisualControls primary={!showPolicy} value={c.footer?.visual??{}} onChange={visual=>onChange({...c,footer:{hidden:c.footer?.hidden??false,text:c.footer?.text??"",visual:footerVisual.parse(visual)}})}/> }
    {showPolicy?<Button type="button" variant="secondary" onClick={()=>onChange({...c,footer:{hidden:false,text:""}})}>Restore platform default</Button>:tab==="appearance"?<><Button type="button" variant="secondary" disabled={appearanceResetUnavailable} onClick={()=>onChange({...c,footer:{...c.footer,hidden:c.footer?.hidden??false,text:c.footer?.text??"",visual:footerVisual.parse(appearanceDefault??{decoration:"NONE",layout:{before:0,padding:0},surface:{variant:"TRANSPARENT"}})}})}>Use {appearanceSource??"default"} Footer appearance</Button><p className="builder-v3-note">{appearanceResetUnavailable?"The original theme is unavailable. Your Footer appearance is preserved.":"Resets only Footer appearance. Text and visibility stay unchanged."}</p></>:<Button type="button" variant="secondary" onClick={()=>onChange({...c,footer:{...c.footer,hidden:c.footer?.hidden??false,text:""}})}>Use platform text</Button>}
  </fieldset>;
}
