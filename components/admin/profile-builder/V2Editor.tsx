"use client";
import {ElementVisualControls,VisualChoice} from "./VisualControls";
import {linkStyle} from "@/lib/profile-visual";
import {SaveDomain} from "./SaveCoordinator";
import {CollectionEditor,CollectionItem} from "./CollectionEditor";
import { Switch } from "@/components/ui/Switch";
import { useState, useEffect, useRef } from "react";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import { itemKinds, itemConfigs, networks, type ItemKind, type V2Data, type V2Section, type V2Item, type V2Image, type V2Link, type V2Command } from "@/lib/profile-v2";
import { SortableList } from "./SortableList";
import { Choice, Field, Toggle, MediaControls, Upload } from "./V2Controls";
import { Button } from "@/components/ui/Button";
import { LINK_TYPE_META } from "@/lib/linkTypes";
import type { LinkType } from "@prisma/client";
export type MutateV2 = (command:V2Command)=>Promise<boolean>;
const presentation = (l:V2Link) => ({ width:l.width as "FULL"|"HALF", iconMode:l.iconMode as "DEFAULT"|"CUSTOM"|"NONE", customIconAssetId:l.customIconAssetId, socialSectionId:l.socialSectionId, socialNetwork:l.socialNetwork as typeof networks[number]|null, v2IsVisible:l.v2IsVisible });
const itemData = (i:V2Item) => ({ kind:i.kind as ItemKind,width:i.width as "FULL"|"HALF",isVisible:i.isVisible,config:i.config,referencedProfileLinkId:i.referencedProfileLinkId });
export const sectionData = (s:V2Section) => ({internalName:s.internalName,visibleTitle:s.visibleTitle,isVisible:s.isVisible,config:s.config});

export function V2Structure({data,persistedData=data,selected,onSelect,onSettings,mutate,busy}:{persistedData?:V2Data;onSettings?:(id:string)=>void;data:V2Data;selected:string|null;onSelect:(id:string)=>void;mutate:MutateV2;busy:boolean}) {
  return <div className="space-y-3"><SortableList fallbackControls={false} selectedId={selected} items={data.sections} label={s=>s.internalName} disabled={busy} onOrder={rows=>void mutate({op:"section-order",orderedIds:rows.map(s=>s.id)})}>
    {s=><div className="builder-row" data-selected={selected===s.id}>
      <button type="button" aria-pressed={selected===s.id} className={`min-w-0 flex-1 break-words text-left text-sm ${selected===s.id?"font-bold":""}`} onClick={()=>onSelect(s.id)}>{s.internalName}<span className="block text-xs font-normal opacity-60">{s.kind==="CUSTOM"&&!s.items.length?"Empty · hidden":s.isVisible?"Visible":"Hidden"}{s.kind==="CUSTOM"?` · ${s.items.length} items`:""}</span></button>
      <Switch label={`${s.isVisible?"Hide":"Show"} ${s.internalName}`} checked={s.isVisible&&!(s.kind==="CUSTOM"&&!s.items.length)} disabled={busy||(s.kind==="CUSTOM"&&!s.items.length)} onChange={isVisible=>void mutate({op:"section-update",id:s.id,data:{...sectionData(persistedData.sections.find(row=>row.id===s.id)??s),isVisible}})}/>
      <details data-overflow-menu className="relative shrink-0"><summary aria-label={`Actions for ${s.internalName}`} className="cursor-pointer list-none rounded p-2">•••</summary>
        <div className="absolute right-0 z-20 w-52 space-y-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-2 shadow-xl">
          <Button type="button" variant="secondary" onClick={()=>onSettings?.(s.id)}>Appearance</Button>
          {s.kind==="CUSTOM"&&<Button type="button" variant="secondary" disabled={busy} onClick={()=>void mutate({op:"section-duplicate",id:s.id})}>Duplicate saved section</Button>}
          {s.kind!=="CORE"&&<Button type="button" variant="destructive" disabled={busy} onClick={()=>{if(window.confirm(`Delete section “${s.internalName}”? Its items will be removed. Canonical links are retained.`))void mutate({op:"section-delete",id:s.id});}}>Delete section</Button>}
        </div>
      </details>
    </div>}
  </SortableList>
  <details className="rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-card)]"><summary className="cursor-pointer list-none px-3 py-2 text-center text-sm font-medium">+ Add section</summary><div className="grid gap-2 border-t border-[var(--admin-border)] p-2">
    {!data.sections.some(s=>s.kind==="SOCIALS")&&<Button type="button" disabled={busy} variant="secondary" onClick={()=>void mutate({op:"section-create",kind:"SOCIALS"})}>Social links</Button>}
    <Button type="button" disabled={busy} variant="secondary" onClick={()=>void mutate({op:"section-create",kind:"CUSTOM"})}>Custom content</Button>
  </div></details></div>;
}
export function BusinessInfoEditor({business,mutate,onPreview}:{business:PublicBusinessProfile;mutate:MutateV2;onPreview:(fields:Record<string,string>)=>void}) {
  const p=business.profile, links=business.v2?.links??[];
  const [values,setValues]=useState({phone:p.phone??links.find(l=>l.type==="PHONE"&&l.isActive)?.url??"",email:p.email??"",address:p.address??"",googleMapsUrl:p.googleMapsUrl??links.find(l=>l.type==="GOOGLE_MAPS"&&l.isActive)?.url??"",
    whatsapp:links.find(l=>l.type==="WHATSAPP"&&l.isActive)?.url??p.whatsapp??"",
    website:links.find(l=>l.type==="WEBSITE"&&l.isActive)?.url??p.website??""});
  const [saving,setSaving]=useState(false);
  const source = { phone:p.phone??links.find(l=>l.type==="PHONE"&&l.isActive)?.url??"", email:p.email??"", address:p.address??"",
    googleMapsUrl:p.googleMapsUrl??links.find(l=>l.type==="GOOGLE_MAPS"&&l.isActive)?.url??"",
    whatsapp:links.find(l=>l.type==="WHATSAPP"&&l.isActive)?.url??p.whatsapp??"",
    website:links.find(l=>l.type==="WEBSITE"&&l.isActive)?.url??p.website??"" };
  const sourceJson = JSON.stringify(source);
  const previousSource = useRef(source);
  useEffect(() => {
    const next: typeof source = JSON.parse(sourceJson);
    const previous = previousSource.current;
    previousSource.current = next;
    setValues(current => {
      const updated = {...current};
      for (const key of Object.keys(next) as (keyof typeof next)[]) {
        if (current[key] === previous[key]) updated[key] = next[key];
      }
      return JSON.stringify(updated) === JSON.stringify(current) ? current : updated;
    });
  }, [sourceJson]);
  return <fieldset disabled={saving} className="space-y-3"><legend className="sr-only">Business information</legend>{Object.entries(values).map(([key,value])=>{const label={phone:"Phone number",email:"Email address",address:"Street address",googleMapsUrl:"Google Maps link",whatsapp:"WhatsApp number",website:"Website address"}[key]??key;return <div key={key}><Field label={label} value={value} onChange={v=>{const next={...values,[key]:v};setValues(next);onPreview(next);}}/></div>;})}
    <SaveDomain dirty={JSON.stringify(values)!==sourceJson} onSave={async()=>{setSaving(true);try{return await mutate({op:"info",data:values});}finally{setSaving(false);}}}>Save Business Info</SaveDomain>
    <p className="text-xs text-[var(--admin-text-secondary)]">These contact details are the source used everywhere on this profile.</p>
  </fieldset>;
}
function ImageEditor({image,organizationId,mutate}:{image:V2Image;organizationId:string;mutate:MutateV2}) {
  const [draft,setDraft]=useState(image);
  const data=(assetId=draft.assetId)=>({assetId,alt:draft.alt,caption:draft.caption||null,destinationUrl:draft.destinationUrl||null});
  return <div className="space-y-2">
    <p className="break-all text-xs">{image.alt||"Image"}</p>
    <Field label="Alt text" value={draft.alt} onChange={alt=>setDraft({...draft,alt})}/>
    <Field label="Caption" value={draft.caption??""} onChange={caption=>setDraft({...draft,caption})}/>
    <Field label="Destination URL" value={draft.destinationUrl??""} onChange={destinationUrl=>setDraft({...draft,destinationUrl})}/>
    <SaveDomain dirty={JSON.stringify(data())!==JSON.stringify({assetId:image.assetId,alt:image.alt,caption:image.caption||null,destinationUrl:image.destinationUrl||null})} onSave={()=>mutate({op:"image-update",id:image.id,data:data()})}>Save image details</SaveDomain>
    <Upload organizationId={organizationId} label="Replace image" onUploaded={async asset=>{if(!await mutate({op:"image-update",id:image.id,data:data(asset.id)}))throw new Error("Image replacement failed.");setDraft({...draft,assetId:asset.id,url:asset.url});}} />
    <Button type="button" variant="destructive" onClick={()=>{if(window.confirm("Remove this image?"))void mutate({op:"image-delete",id:image.id});}}>Remove image</Button>
  </div>;
}
function ItemEditor({item:i,persisted=i,section,organizationId,mutate,preview,links,busy} :{persisted?:V2Item;item:V2Item;section:V2Section;organizationId:string;mutate:MutateV2;preview:(s:V2Section)=>void;links:V2Link[];busy:boolean}) {
  const patch=(data:Partial<V2Item>)=>preview({...section,items:section.items.map(item=>item.id===i.id?{...item,...data}:item)});
  const config=(value:Record<string,unknown>)=>patch({config:value});
  const c=i.config;
  const [selectedImage,setSelectedImage]=useState<string|null>(null);
  return <div className="space-y-3">
    <div className="space-y-3">
    <h4 className="font-medium">{i.kind.replaceAll("_"," ")}</h4>
    <Choice label="Item width" value={i.width} options={["FULL","HALF"]} onChange={width=>patch({width})}/>
    {["HEADING","TEXT","ICON_TEXT"].includes(i.kind)&&<>
      <Field label="Text" multiline value={String(c.text??"")} onChange={text=>config({...c,text})}/>
      {i.kind==="ICON_TEXT"&&<Choice label="Icon" value={String(c.icon)} options={["STAR","HEART","CHECK","PIN"]} onChange={icon=>config({...c,icon})}/>}
    </>}
    {["LINK","CONTACT","MAP","REVIEW","SOCIAL","MENU"].includes(i.kind)&&<Field label="Label" value={String(c.label??"")} onChange={label=>config({...c,label})}/>}
    {i.kind==="LINK"&&!i.referencedProfileLinkId&&<Field label="Destination URL" value={String(c.url??"")} onChange={url=>config({...c,url})}/>}
    {i.kind==="CONTACT"&&<Choice label="Contact action" value={String(c.action)} options={["PHONE","WHATSAPP","EMAIL","WEBSITE","SAVE_CONTACT"]} onChange={action=>config({...c,action})}/>}
    {["SOCIAL","LINK"].includes(i.kind)&&<label className="block text-sm">Reuse a saved link (optional)<select className="block w-full rounded border bg-[var(--admin-bg)] p-2" value={i.referencedProfileLinkId??""} onChange={e=>patch({referencedProfileLinkId:e.target.value||null})}>
      <option value="">Choose a link</option>{links.map(l=><option key={l.id} value={l.id}>{l.label||l.type}</option>)}</select></label>}
    {i.kind==="SPACER"&&<Choice label="Space" value={String(c.size)} options={["SMALL","MEDIUM","LARGE"]} onChange={size=>config({...c,size})}/>}
    {(["IMAGE","CAROUSEL"].includes(i.kind)||(i.kind==="TEXT"&&!!c.testimonial))&&<>
      {i.kind!=="TEXT"&&<MediaControls config={c} onChange={config} carousel={i.kind==="CAROUSEL"}/>}
      <CollectionEditor label="Images" items={i.images} disabled={busy} onOrder={rows=>void mutate({op:"image-order",itemId:i.id,orderedIds:rows.map(m=>m.id)})}>
        {m=><CollectionItem label={m.alt||m.caption||"Image"} expanded={selectedImage===m.id} onExpand={()=>setSelectedImage(value=>value===m.id?null:m.id)}><ImageEditor image={m} organizationId={organizationId} mutate={mutate}/></CollectionItem>}
      </CollectionEditor>
      {(i.kind==="CAROUSEL"||!i.images.length)&&<Upload organizationId={organizationId} label="Upload images" multiple={i.kind==="CAROUSEL"} disabled={busy}
        onUploaded={async asset=>{if(!await mutate({op:"image-create",itemId:i.id,data:{assetId:asset.id,alt:"",caption:null,destinationUrl:null}}))throw new Error("Image attach failed.");}}/>}
    </>}
    {!["DIVIDER","SPACER"].includes(i.kind)&&<ElementVisualControls scope="item" config={c} onChange={config} layout={false} action={["LINK","CONTACT","MAP","REVIEW","SOCIAL","MENU"].includes(i.kind)}/>}
    {["LINK","CONTACT","MAP","REVIEW","SOCIAL","MENU"].includes(i.kind)&&<Field label="Subtitle" value={String(c.subtitle??"")} onChange={subtitle=>config({...c,subtitle})}/>}
    {i.kind==="TEXT"&&<details className="rounded border p-3"><summary>Testimonial attribution</summary><Toggle label="Use as testimonial" value={!!c.testimonial} onChange={enabled=>{const next={...c};if(enabled)next.testimonial={author:""};else delete next.testimonial;config(next);}}/>{!!c.testimonial&&<Field label="Author" value={String((c.testimonial as Record<string,unknown>).author??"")} onChange={author=>config({...c,testimonial:{...(c.testimonial as Record<string,unknown>),author}})}/>}</details>}
    <div className="flex flex-wrap gap-2">
      <SaveDomain dirty={JSON.stringify(itemData(i))!==JSON.stringify(itemData(persisted))} onSave={()=>mutate({op:"item-update",id:i.id,data:itemData(i)})}>Save item</SaveDomain>
      <details className="rounded border border-[var(--admin-border)] p-2"><summary className="cursor-pointer">More item actions</summary><div className="mt-2 flex flex-wrap gap-2">
      <Button type="button" variant="secondary" disabled={busy} onClick={()=>void mutate({op:"item-duplicate",id:i.id})}>Duplicate saved item</Button>
      <Button type="button" variant="destructive" disabled={busy} onClick={()=>{if(window.confirm("Delete this item?"))void mutate({op:"item-delete",id:i.id});}}>Delete item</Button>
      </div></details>
    </div>
    </div>

  </div>;
}
export function V2SectionEditor({section:s,organizationId,data,mutate,preview,busy,settingsOnly=false,onCancel,onCancelSettings,persistedSection=s}:{onCancelSettings?:()=>void;persistedSection?:V2Section;settingsOnly?:boolean;onCancel?:(id:string)=>void;section:V2Section;organizationId:string;data:V2Data;mutate:MutateV2;preview:(s:V2Section)=>void;busy:boolean}) {
  const [kind,setKind]=useState<ItemKind>("TEXT");
  const [selectedItem,setSelectedItem]=useState<string|null>(null);
  const [visited,setVisited]=useState<string[]>([]);
  const open=(id:string)=>{setSelectedItem(value=>value===id?null:id);setVisited(ids=>ids.includes(id)?ids:[...ids,id]);};
  return <div className="space-y-4">
    <div hidden={settingsOnly} className="space-y-4">
      {s.kind!=="CORE"&&<Field label="Section name" value={s.internalName} onChange={internalName=>preview({...s,internalName})}/>}
      <Field label="Section heading (optional)" value={s.visibleTitle??""} onChange={visibleTitle=>preview({...s,visibleTitle:visibleTitle||null})}/>
      {s.singletonKey==="BUSINESS_INFO"&&<fieldset className="space-y-1"><legend className="text-sm font-medium">Show on your profile</legend>{[["phone","Phone"],["whatsapp","WhatsApp"],["email","Email"],["website","Website"],["address","Address"],["maps","Map link"]].map(([key,label])=><Toggle key={key} label={label} value={s.config[key]===true} onChange={value=>preview({...s,config:{...s.config,[key]:value}})}/>)}</fieldset>}
    </div>
    <div hidden={!settingsOnly} className="space-y-4">
    {s.kind==="SOCIALS"&&<>
      <VisualChoice label="Presentation" value={String(s.config.composition??"ICONS")} options={[{value:"ICONS",label:"Icons"},{value:"CARDS",label:"Buttons"}]} onChange={composition=>preview({...s,config:{...s.config,composition}})}/>
      <Toggle label="Show labels" value={s.config.labels===true} onChange={labels=>preview({...s,config:{...s.config,labels}})}/>
      <ElementVisualControls config={s.config} onChange={config=>preview({...s,config})}/>
    </>}
    {s.kind!=="SOCIALS"&&<ElementVisualControls config={s.config} onChange={config=>preview({...s,config})} action={s.singletonKey!=="BIO"} layout={s.singletonKey!=="BIO"&&s.singletonKey!=="MENU"}/>}
    <SaveDomain dirty={JSON.stringify(sectionData(s))!==JSON.stringify(sectionData(persistedSection))} onSave={()=>mutate({op:"section-update",id:s.id,data:sectionData(s)})}>Save section</SaveDomain>
    </div>
    {s.kind==="CUSTOM"&&<div hidden={settingsOnly}>
      <CollectionEditor label="Custom items" items={s.items} disabled={busy} onOrder={rows=>void mutate({op:"item-order",sectionId:s.id,orderedIds:rows.map(i=>i.id)})}>{i=><CollectionItem label={String(i.config.text||i.config.label||i.kind)} expanded={selectedItem===i.id} onExpand={()=>open(i.id)} checked={i.isVisible} disabled={busy} onToggle={isVisible=>void mutate({op:"item-update",id:i.id,data:{...itemData(persistedSection.items.find(row=>row.id===i.id)??i),isVisible}})}>{visited.includes(i.id)&&<ItemEditor item={i} persisted={persistedSection.items.find(row=>row.id===i.id)} section={s} organizationId={organizationId} mutate={mutate} preview={preview} links={data.links} busy={busy}/>}</CollectionItem>}</CollectionEditor>
      <VisualChoice label="Add content" value={kind} options={itemKinds.map(value=>({value,label:({HEADING:"Heading",TEXT:"Text",LINK:"Link",IMAGE:"Image",CAROUSEL:"Gallery",DIVIDER:"Divider",SPACER:"Space",ICON_TEXT:"Highlighted text",CONTACT:"Contact action",MAP:"Map",REVIEW:"Review link",SOCIAL:"Social link",MENU:"Menu button"} as Record<string,string>)[value]}))} onChange={v=>setKind(v as ItemKind)}/>
      <Button type="button" disabled={busy} variant="secondary" onClick={()=>void mutate({op:"item-create",sectionId:s.id,data:{kind,width:"FULL",isVisible:true,config:itemConfigs[kind].parse({}),referencedProfileLinkId:null}})}>+ Add item</Button>
    </div>}

  </div>;
}

function LinkForm({initial,organizationId,mutate,onClose,busy,onPreview,style,onStyle}:{style?:Record<string,unknown>;onStyle?:(style:Record<string,unknown>)=>void;onPreview?:(link:V2Link)=>void;initial:V2Link;organizationId:string;mutate:MutateV2;onClose:()=>void;busy:boolean}) {
  const [l,setLocal]=useState(initial);
  const previousInitial=useRef(initial);
  const submittedLink=useRef<V2Link|null>(null);
  useEffect(()=>{const previous=submittedLink.current??previousInitial.current;previousInitial.current=initial;submittedLink.current=null;setLocal(current=>({...initial,...Object.fromEntries(Object.entries(current).filter(([key,value])=>value!==previous[key as keyof V2Link]))}));},[initial]);
  const set=(next:V2Link)=>{setLocal(next);onPreview?.(next);};
  const [iconAsset,setIconAsset]=useState<string|null>(null);
  const destinationLabel:Record<string,string>={PHONE:"Phone number",WHATSAPP:"WhatsApp number",EMAIL:"Email address",WEBSITE:"Website address",GOOGLE_MAPS:"Google Maps link",GOOGLE_REVIEWS:"Review page link",INSTAGRAM:"Instagram profile",FACEBOOK:"Facebook profile",TIKTOK:"TikTok profile",YOUTUBE:"YouTube channel",LINKEDIN:"LinkedIn profile",X:"X / Twitter profile",CUSTOM:"Destination URL"};
  const businessOwned=["PHONE","WHATSAPP","EMAIL","WEBSITE","GOOGLE_MAPS"].includes(l.type);
  return <div className="space-y-3 rounded border border-[var(--admin-border)] p-3">
    {l.socialSectionId?<VisualChoice label="Social network" value={l.socialNetwork??l.type} options={networks.map(value=>({value,label:value==="X"?"X / Twitter":value.charAt(0)+value.slice(1).toLowerCase()}))} onChange={socialNetwork=>set({...l,socialNetwork,type:!["INSTAGRAM","FACEBOOK","TIKTOK"].includes(socialNetwork)?"CUSTOM":socialNetwork as LinkType})}/>:businessOwned?<p className="rounded-lg bg-[var(--admin-secondary)] p-3 text-sm">This destination comes from Business information. You can change its label and appearance here.</p>:<Choice label="Link type" value={l.type} options={Object.keys(LINK_TYPE_META).filter(type=>!["PHONE","WHATSAPP","EMAIL","WEBSITE","GOOGLE_MAPS"].includes(type))} onChange={type=>set({...l,type:type as LinkType})}/>}
    <Field label="Label" value={l.label??""} onChange={label=>set({...l,label})}/>
    {!businessOwned&&<Field label={destinationLabel[l.socialNetwork??l.type]??"Destination URL"} value={l.url} onChange={url=>set({...l,url})}/>}
    <details><summary className="cursor-pointer text-sm font-medium">More options</summary><div className="mt-3 space-y-3"><Choice label="Width" value={l.width} options={["FULL","HALF"]} onChange={width=>set({...l,width})}/><Choice label="Icon" value={l.iconMode} options={["DEFAULT","CUSTOM","NONE"]} onChange={iconMode=>set({...l,iconMode,customIconAssetId:iconMode==="CUSTOM"?l.customIconAssetId:null})}/>{l.iconMode==="CUSTOM"&&<Upload organizationId={organizationId} label="Upload custom icon" onUploaded={async asset=>{set({...l,customIconAssetId:asset.id,iconUrl:asset.url});setIconAsset(asset.id);}}/>}</div></details>
    {onStyle&&l.id&&<><Field label="Subtitle" value={String(style?.subtitle??"")} onChange={subtitle=>onStyle({...style,subtitle})}/><ElementVisualControls scope="link" config={{visual:((({subtitle,...visual})=>visual)(linkStyle.parse(style??{})))}} layout={false} onChange={next=>onStyle({...((next.visual as Record<string,unknown>)??{}),subtitle:style?.subtitle})}/></>}
    <SaveDomain dirty={JSON.stringify(l)!==JSON.stringify(initial)} onSave={async()=>{submittedLink.current=l;const ok=await mutate({op:"link-save",id:l.id||null,data:{type:l.type,label:l.label??"",value:l.url,isActive:initial.isActive},presentation:presentation(l)});if(ok)onClose();return ok;}}>Save link</SaveDomain>
  </div>;
}
export function V2LinksEditor({data,sectionId,organizationId,mutate,busy,onPreview,onSectionPreview}:{onSectionPreview?:(s:V2Section)=>void;onPreview?:(link:V2Link|null,id:string)=>void;data:V2Data;sectionId:string|null;organizationId:string;mutate:MutateV2;busy:boolean}) {
  const [expanded,setExpanded]=useState<string|null>(null);
  const [visited,setVisited]=useState<string[]>([]);
  const [newKey,setNewKey]=useState(0);
  const open=(id:string)=>{setExpanded(current=>current===id?null:id);setVisited(ids=>ids.includes(id)?ids:[...ids,id]);};
  const links=data.links.filter(l=>l.socialSectionId===sectionId);
  const socials=data.sections.find(s=>s.kind==="SOCIALS");
  const initial:V2Link={id:"",type:sectionId?"INSTAGRAM":"CUSTOM",label:"",url:"",isActive:true,width:"FULL",iconMode:"DEFAULT",v2IsVisible:true,customIconAssetId:null,iconUrl:null,socialSectionId:sectionId,socialNetwork:sectionId?"INSTAGRAM":null};
  const owner=data.sections.find(s=>sectionId?s.id===sectionId:s.singletonKey==="LINKS");
  const styles=(owner?.config.linkStyles??{}) as Record<string,Record<string,unknown>>;
  const form=(l:V2Link)=><LinkForm key={l.id||newKey} style={styles[l.id]} onStyle={owner&&onSectionPreview?style=>onSectionPreview({...owner,config:{...owner.config,linkStyles:{...styles,[l.id]:style}}}):undefined} onPreview={value=>onPreview?.(value,l.id||`new-${sectionId||"links"}`)} initial={l} organizationId={organizationId} mutate={mutate} busy={busy} onClose={()=>{onPreview?.(null,l.id||`new-${sectionId||"links"}`);if(!l.id)setNewKey(k=>k+1);setExpanded(null);}}/>;
  return <div className="space-y-4">
    <CollectionEditor fallbackControls={false} label={sectionId?"Socials":"Links"} items={links} disabled={busy} onOrder={rows=>void mutate({op:"link-order",socialSectionId:sectionId,orderedIds:rows.map(l=>l.id)})}>
      {(l,order)=><CollectionItem label={l.label||l.type} expanded={expanded===l.id} onExpand={()=>open(l.id)} checked={l.isActive} disabled={busy} onToggle={isActive=>void mutate({op:"link-save",id:l.id,data:{type:l.type,label:l.label??"",value:l.url,isActive},presentation:presentation(l)})}
        actions={<details data-overflow-menu className="relative"><summary aria-label={`Actions for ${l.label||l.type}`} className="cursor-pointer list-none p-2">⋯</summary><div className="absolute right-0 z-20 w-48 rounded border bg-[var(--admin-card)] p-2 shadow">
          <Button type="button" variant="secondary" disabled={busy||order.first} onClick={()=>order.move(-1)}>Move up</Button><Button type="button" variant="secondary" disabled={busy||order.last} onClick={()=>order.move(1)}>Move down</Button>
          {socials&&<Button type="button" variant="secondary" disabled={busy} onClick={async()=>{if(await mutate({op:"link-presentation",id:l.id,data:{...presentation(l),socialSectionId:sectionId?null:socials.id}}))setExpanded(null);}}>{sectionId?"Move to Links":"Move to Socials"}</Button>}
          <Button type="button" variant="destructive" disabled={busy} onClick={async()=>{if(window.confirm(`Delete link “${l.label||l.type}”?`)&&await mutate({op:"link-delete",id:l.id})){onPreview?.(null,l.id);setExpanded(null);}}}>Delete</Button>
        </div></details>}>{visited.includes(l.id)&&form(l)}</CollectionItem>}
    </CollectionEditor>
    {expanded==="new"&&form(initial)}
    <Button type="button" variant="secondary" disabled={busy} onClick={()=>open("new")}>+ Add {sectionId?"Social":"Link"}</Button>
  </div>;
}
