"use client";
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
export function GlobalDesignControls({value,theme,onChange}:Props) {
  const c=value??resolveProfileDesign(undefined,theme);
  return <div className="space-y-5 mb-5" aria-label="Global design">
    <DesignControlGroup title="Theme"><Choice label="Profile theme" value={c.theme} options={["CLASSIC","LIQUID_GLASS","DIMENSIONAL"]} onChange={theme=>onChange({...c,theme:theme as ProfileDesign["theme"]})}/></DesignControlGroup>
    <DesignControlGroup title="Background"><Choice label="Background preset" value={c.backgroundPreset??"CUSTOM"} options={["CUSTOM","DIFFUSION","AURORA","PEARL","DUSK","MESH","MIDNIGHT"]} onChange={backgroundPreset=>onChange({...c,backgroundPreset:backgroundPreset as ProfileDesign["backgroundPreset"]})}/><p className="text-xs">Aurora, Mesh and Diffusion reveal Glass depth. Custom uses the saved background controls below.</p></DesignControlGroup>
    <DesignControlGroup title="Style"><Choice label="Hover Style" value={c.hoverStyle??"SOFT_LIFT"} options={hoverStyles} onChange={hoverStyle=>onChange({...c,hoverStyle:hoverStyle as ProfileDesign["hoverStyle"]})}/><Toggle label="Use Accent Color" value={c.accentEnabled!==false} onChange={accentEnabled=>onChange({...c,accentEnabled})}/><ColorPicker label="Card / Surface Color" value={c.surfaceColor??""} allowEmpty onChange={surfaceColor=>onChange({...c,surfaceColor:surfaceColor||null})}/></DesignControlGroup>
    <DesignControlGroup title="Advanced shape"><Choice label="Border radius" value={c.radius} options={["DEFAULT","SQUARE","SOFT","ROUNDED","PILL"]} onChange={radius=>onChange({...c,radius:radius as ProfileDesign["radius"]})}/><Choice label="Card size" value={c.cardSize??"MEDIUM"} options={["SMALL","MEDIUM","LARGE"]} onChange={cardSize=>onChange({...c,cardSize:cardSize as ProfileDesign["cardSize"]})}/></DesignControlGroup>
    <DesignControlGroup title="Advanced spacing"><Choice label="Spacing / density" value={c.density} options={["COMPACT","COMFORTABLE","SPACIOUS"]} onChange={density=>onChange({...c,density:density as ProfileDesign["density"]})}/></DesignControlGroup>
    <DesignControlGroup title="Icons"><Choice label="Icon set" value={c.iconSet??"FEATHER"} options={["FEATHER","IONIC","BOOTSTRAP","MATERIAL","REMIX","HERO","ANT","CSSGG","GROMMET","OCTICONS"]} onChange={iconSet=>onChange({...c,iconSet:iconSet as ProfileDesign["iconSet"]})}/><Choice label="Icon style" value={c.iconStyle} options={["OUTLINE","FILLED","ROUNDED","MINIMAL"]} onChange={iconStyle=>onChange({...c,iconStyle:iconStyle as ProfileDesign["iconStyle"]})}/><Choice label="Icon color" value={c.iconColor??"MONOCHROME"} options={["THEME","MONOCHROME","BRAND"]} onChange={iconColor=>onChange({...c,iconColor:iconColor as ProfileDesign["iconColor"]})}/></DesignControlGroup>
    <DesignControlGroup title="Advanced surfaces"><Choice label="Default surface" value={c.surface} options={["MINIMAL","SOFT","ELEVATED","GLASS"]} onChange={surface=>onChange({...c,surface:surface as ProfileDesign["surface"]})}/></DesignControlGroup>
  </div>;
}
export function FooterEditor({value,theme,onChange,role,premium=false}:Props&{role:string;premium?:boolean}) {
  const c=value??resolveProfileDesign(undefined,theme),allowed=brandingCapabilities(role,premium).customizeFooter;
  return <fieldset disabled={!allowed} className="space-y-4" aria-label="Footer editor"><legend className="text-lg font-semibold">Footer</legend>
    <p className="text-sm">{role==="SUPER_ADMIN"?"Super Admin can configure branding for every business.":"Custom branding requires an eligible subscription."}</p>
    <Toggle label="Hide platform branding" value={c.footer?.hidden??false} onChange={hidden=>onChange({...c,footer:{text:c.footer?.text??"",hidden}})}/>
    <Field label="Footer text (blank uses platform name)" value={c.footer?.text??""} onChange={text=>onChange({...c,footer:{hidden:c.footer?.hidden??false,text}})}/>
    <Button type="button" variant="secondary" onClick={()=>onChange({...c,footer:{hidden:false,text:""}})}>Restore platform default</Button>
  </fieldset>;
}
