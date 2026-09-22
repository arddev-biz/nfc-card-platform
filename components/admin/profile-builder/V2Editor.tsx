"use client";
import {SaveDomain} from "./SaveCoordinator";
import {CollectionEditor,CollectionItem} from "./CollectionEditor";
import { Switch } from "@/components/ui/Switch";
import { useState, useEffect, useRef } from "react";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import { itemKinds, itemConfigs, networks, type ItemKind, type V2Data, type V2Section, type V2Item, type V2Image, type V2Link, type V2Command } from "@/lib/profile-v2";
import { SortableList } from "./SortableList";
import { Choice, Field, Toggle, TextControls, MediaControls, Upload, SurfaceControls } from "./V2Controls";
import { Button } from "@/components/ui/Button";
import { LINK_TYPE_META } from "@/lib/linkTypes";
import type { LinkType } from "@prisma/client";
export type MutateV2 = (command:V2Command)=>Promise<boolean>;
const presentation = (l:V2Link) => ({ width:l.width as "FULL"|"HALF", iconMode:l.iconMode as "DEFAULT"|"CUSTOM"|"NONE", customIconAssetId:l.customIconAssetId, socialSectionId:l.socialSectionId, socialNetwork:l.socialNetwork as typeof networks[number]|null, v2IsVisible:l.v2IsVisible });
const itemData = (i:V2Item) => ({ kind:i.kind as ItemKind,width:i.width as "FULL"|"HALF",isVisible:i.isVisible,config:i.config,referencedProfileLinkId:i.referencedProfileLinkId });
export const sectionData = (s:V2Section) => ({internalName:s.internalName,visibleTitle:s.visibleTitle,isVisible:s.isVisible,config:s.config});

export function V2Structure({data,persistedData=data,selected,onSelect,onSettings,mutate,busy}:{persistedData?:V2Data;onSettings?:(id:string)=>void;data:V2Data;selected:string|null;onSelect:(id:string)=>void;mutate:MutateV2;busy:boolean}) {
  return <div className="space-y-3"><SortableList selectedId={selected} items={data.sections} label={s=>s.internalName} disabled={busy} onOrder={rows=>void mutate({op:"section-order",orderedIds:rows.map(s=>s.id)})}>
    {s=><div className="builder-row" data-selected={selected===s.id}>
      <button type="button" aria-pressed={selected===s.id} className={`min-w-0 flex-1 break-words text-left text-sm py-2 ${selected===s.id?"font-bold":""}`} onClick={()=>onSelect(s.id)}>{s.internalName}<span className="block text-xs font-normal opacity-60">{s.isVisible?"Visible":"Hidden"}{s.kind==="CUSTOM"?` · ${s.items.length} items`:""}</span></button>
      <Switch label={`${s.isVisible?"Hide":"Show"} ${s.internalName}`} checked={s.isVisible} disabled={busy} onChange={isVisible=>void mutate({op:"section-update",id:s.id,data:{...sectionData(persistedData.sections.find(row=>row.id===s.id)??s),isVisible}})}/>
      <details data-overflow-menu className="relative shrink-0"><summary aria-label={`Actions for ${s.internalName}`} className="cursor-pointer list-none rounded p-2">•••</summary>
        <div className="absolute right-0 z-20 w-52 space-y-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-2 shadow-xl">
          <Button type="button" variant="secondary" onClick={()=>onSettings?.(s.id)}>{s.kind==="CORE"?"Section settings":"Settings / Rename"}</Button>
          {s.kind==="CUSTOM"&&<Button type="button" variant="secondary" disabled={busy} onClick={()=>void mutate({op:"section-duplicate",id:s.id})}>Duplicate saved section</Button>}
          {s.kind!=="CORE"&&<Button type="button" variant="destructive" disabled={busy} onClick={()=>{if(window.confirm(`Delete section “${s.internalName}”? Its items will be removed. Canonical links are retained.`))void mutate({op:"section-delete",id:s.id});}}>Delete section</Button>}
        </div>
      </details>
    </div>}
  </SortableList>
  <div className="flex flex-wrap gap-2">
    {!data.sections.some(s=>s.kind==="SOCIALS")&&<Button type="button" disabled={busy} variant="secondary" onClick={()=>void mutate({op:"section-create",kind:"SOCIALS"})}>+ Socials</Button>}
    <Button type="button" disabled={busy} variant="secondary" onClick={()=>void mutate({op:"section-create",kind:"CUSTOM"})}>+ Custom section</Button>
  </div></div>;
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
  return <fieldset disabled={saving} className="space-y-3"><legend className="text-lg font-semibold">Business Info</legend>{Object.entries(values).map(([key,value])=>{const label={phone:"Phone",email:"Email",address:"Address",googleMapsUrl:"Google Maps URL",whatsapp:"WhatsApp",website:"Website"}[key]??key;return <div key={key}><Field label={label} value={value} onChange={v=>{const next={...values,[key]:v};setValues(next);onPreview(next);}}/></div>;})}
    <SaveDomain dirty={JSON.stringify(values)!==sourceJson} onSave={async()=>{setSaving(true);try{return await mutate({op:"info",data:values});}finally{setSaving(false);}}}>Save Business Info</SaveDomain>
    <Button type="button" variant="secondary" onClick={()=>{setValues(previousSource.current);onPreview(previousSource.current);}}>Cancel Business Info changes</Button>
    <p className="text-xs opacity-70">WhatsApp and Website edit their canonical links. Clearing retains existing link records but disables their fallbacks.</p>
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
    <Button type="button" variant="secondary" onClick={()=>setDraft(image)}>Cancel image changes</Button>
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
      <TextControls config={c} onChange={config}/>
    </>}
    {["LINK","CONTACT","MAP","REVIEW","SOCIAL","MENU"].includes(i.kind)&&<Field label="Label" value={String(c.label??"")} onChange={label=>config({...c,label})}/>}
    {i.kind==="LINK"&&!i.referencedProfileLinkId&&<Field label="Destination URL" value={String(c.url??"")} onChange={url=>config({...c,url})}/>}
    {i.kind==="CONTACT"&&<Choice label="Contact action" value={String(c.action)} options={["PHONE","WHATSAPP","EMAIL","WEBSITE"]} onChange={action=>config({...c,action})}/>}
    {["SOCIAL","LINK"].includes(i.kind)&&<label className="block text-sm">Canonical existing link (optional)<select className="block w-full rounded border bg-[var(--admin-bg)] p-2" value={i.referencedProfileLinkId??""} onChange={e=>patch({referencedProfileLinkId:e.target.value||null})}>
      <option value="">Choose a link</option>{links.map(l=><option key={l.id} value={l.id}>{l.label||l.type}</option>)}</select></label>}
    {i.kind==="SPACER"&&<Choice label="Space" value={String(c.size)} options={["SMALL","MEDIUM","LARGE"]} onChange={size=>config({...c,size})}/>}
    {["IMAGE","CAROUSEL"].includes(i.kind)&&<>
      <MediaControls config={c} onChange={config} carousel={i.kind==="CAROUSEL"}/>
      <CollectionEditor label="Images" items={i.images} disabled={busy} onOrder={rows=>void mutate({op:"image-order",itemId:i.id,orderedIds:rows.map(m=>m.id)})}>
        {m=><CollectionItem label={m.alt||m.caption||"Image"} expanded={selectedImage===m.id} onExpand={()=>setSelectedImage(value=>value===m.id?null:m.id)}><ImageEditor image={m} organizationId={organizationId} mutate={mutate}/></CollectionItem>}
      </CollectionEditor>
      {(i.kind==="CAROUSEL"||!i.images.length)&&<Upload organizationId={organizationId} label="Upload images" multiple={i.kind==="CAROUSEL"} disabled={busy}
        onUploaded={async asset=>{if(!await mutate({op:"image-create",itemId:i.id,data:{assetId:asset.id,alt:"",caption:null,destinationUrl:null}}))throw new Error("Image attach failed.");}}/>}
    </>}
    {!(["DIVIDER","SPACER"].includes(i.kind))&&<SurfaceControls config={c} onChange={config}/>}
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
    <div hidden={!settingsOnly} className="space-y-4">
    {s.kind!=="CORE"&&<Field label="Internal section name" value={s.internalName} onChange={internalName=>preview({...s,internalName})}/>}
    <Field label="Visible heading (optional)" value={s.visibleTitle??""} onChange={visibleTitle=>preview({...s,visibleTitle:visibleTitle||null})}/>
    {s.singletonKey==="BIO"&&<TextControls config={s.config} onChange={config=>preview({...s,config})}/>}
    {s.singletonKey==="BUSINESS_INFO"&&<div><p className="text-sm font-medium">Public presentation (independent of saved data)</p>{["phone","whatsapp","email","website","address","maps"].map(key=><Toggle key={key} label={`Show ${key}`} value={s.config[key]===true} onChange={value=>preview({...s,config:{...s.config,[key]:value}})}/>)}</div>}
    {s.kind==="SOCIALS"&&<>
      <Choice label="Social Icon Style" value={String(s.config.containerStyle??"ICON_ONLY")} options={["ICON_ONLY","FILLED","OUTLINE"]} onChange={containerStyle=>preview({...s,config:{...s.config,containerStyle}})}/>
      <Choice label="Icon container shape" value={String(s.config.shape??"CIRCLE")} options={["CIRCLE","ROUNDED","SQUARE"]} onChange={shape=>preview({...s,config:{...s.config,shape}})}/>
      {s.config.containerStyle&&s.config.containerStyle!=="ICON_ONLY"&&<><Toggle label="Custom container color" value={!!s.config.containerColor} onChange={enabled=>preview({...s,config:{...s.config,containerColor:enabled?"#ffffff":null}})}/>{!!s.config.containerColor&&<Field type="color" label="Container color" value={String(s.config.containerColor)} onChange={containerColor=>preview({...s,config:{...s.config,containerColor}})}/>}<Toggle label="Container border" value={s.config.border===true} onChange={border=>preview({...s,config:{...s.config,border}})}/><Toggle label="Custom border color" value={!!s.config.borderColor} onChange={enabled=>preview({...s,config:{...s.config,borderColor:enabled?"#64748b":null}})}/>{!!s.config.borderColor&&<Field type="color" label="Border color" value={String(s.config.borderColor)} onChange={borderColor=>preview({...s,config:{...s.config,borderColor}})}/>}</>}
      <Choice label="Alignment" value={String(s.config.align??"CENTER")} options={["LEFT","CENTER","RIGHT"]} onChange={align=>preview({...s,config:{...s.config,align}})}/>
      <Choice label="Icon size" value={String(s.config.iconSize??"MEDIUM")} options={["SMALL","MEDIUM","LARGE"]} onChange={iconSize=>preview({...s,config:{...s.config,iconSize}})}/>
      <Choice label="Social spacing" value={String(s.config.spacing??"COMFORTABLE")} options={["COMPACT","COMFORTABLE","SPACIOUS"]} onChange={spacing=>preview({...s,config:{...s.config,spacing}})}/>
      <Choice label="Social icon color" value={String(s.config.iconColor??"INHERIT")} options={["INHERIT","THEME","MONOCHROME","BRAND"]} onChange={iconColor=>preview({...s,config:{...s.config,iconColor}})}/>
      <Toggle label="Show follower count" value={s.config.showFollowerCount===true} onChange={showFollowerCount=>preview({...s,config:{...s.config,showFollowerCount}})}/>
      <p className="text-xs text-[var(--admin-text-secondary)]">Follower counts unavailable: no authorized provider is connected. Enabling this setting never invents a count.</p>
      <Toggle label="Icons and labels" value={s.config.labels===true} onChange={labels=>preview({...s,config:{...s.config,labels}})}/>
    </>}
    <SurfaceControls config={s.config} onChange={config=>preview({...s,config})}/>
    <div className="flex flex-wrap gap-2"><SaveDomain dirty={JSON.stringify(sectionData(s))!==JSON.stringify(sectionData(persistedSection))} onSave={()=>mutate({op:"section-update",id:s.id,data:sectionData(s)})}>Save section settings</SaveDomain><Button type="button" variant="secondary" onClick={onCancelSettings}>Cancel section changes</Button>
    </div>
    </div>
    {s.kind==="CUSTOM"&&<div hidden={settingsOnly}>
      <CollectionEditor label="Custom items" items={s.items} disabled={busy} onOrder={rows=>void mutate({op:"item-order",sectionId:s.id,orderedIds:rows.map(i=>i.id)})}>{i=><CollectionItem label={String(i.config.text||i.config.label||i.kind)} expanded={selectedItem===i.id} onExpand={()=>open(i.id)} checked={i.isVisible} disabled={busy} onToggle={isVisible=>void mutate({op:"item-update",id:i.id,data:{...itemData(persistedSection.items.find(row=>row.id===i.id)??i),isVisible}})}>{visited.includes(i.id)&&<><ItemEditor item={i} persisted={persistedSection.items.find(row=>row.id===i.id)} section={s} organizationId={organizationId} mutate={mutate} preview={preview} links={data.links} busy={busy}/><Button type="button" variant="secondary" onClick={()=>{onCancel?.(i.id);setSelectedItem(null);}}>Cancel item changes</Button></>}</CollectionItem>}</CollectionEditor>
      <Choice label="New item" value={kind} options={itemKinds} onChange={v=>setKind(v as ItemKind)}/>
      <Button type="button" disabled={busy} variant="secondary" onClick={()=>void mutate({op:"item-create",sectionId:s.id,data:{kind,width:"FULL",isVisible:true,config:itemConfigs[kind].parse({}),referencedProfileLinkId:null}})}>+ Add item</Button>
    </div>}

  </div>;
}

function LinkForm({initial,organizationId,mutate,onClose,busy,onPreview}:{onPreview?:(link:V2Link)=>void;initial:V2Link;organizationId:string;mutate:MutateV2;onClose:()=>void;busy:boolean}) {
  const [l,setLocal]=useState(initial);
  const previousInitial=useRef(initial);
  const submittedLink=useRef<V2Link|null>(null);
  useEffect(()=>{const previous=submittedLink.current??previousInitial.current;previousInitial.current=initial;submittedLink.current=null;setLocal(current=>({...initial,...Object.fromEntries(Object.entries(current).filter(([key,value])=>value!==previous[key as keyof V2Link]))}));},[initial]);
  const set=(next:V2Link)=>{setLocal(next);onPreview?.(next);};
  const [iconAsset,setIconAsset]=useState<string|null>(null);
  return <div className="space-y-3 rounded border border-[var(--admin-border)] p-3">
    <Choice label="Link type" value={l.type} options={Object.keys(LINK_TYPE_META)} onChange={type=>set({...l,type:type as LinkType})}/>
    <Field label="Label" value={l.label??""} onChange={label=>set({...l,label})}/>
    <Field label="Value / URL" value={l.url} onChange={url=>set({...l,url})}/>
    <Toggle label="Visible in this section" value={l.v2IsVisible} onChange={v2IsVisible=>set({...l,v2IsVisible})}/>
    <Choice label="Width" value={l.width} options={["FULL","HALF"]} onChange={width=>set({...l,width})}/>
    <Choice label="Icon" value={l.iconMode} options={["DEFAULT","CUSTOM","NONE"]} onChange={iconMode=>set({...l,iconMode,customIconAssetId:iconMode==="CUSTOM"?l.customIconAssetId:null})}/>
    {l.iconMode==="CUSTOM"&&<Upload organizationId={organizationId} label="Upload custom icon" onUploaded={async asset=>{set({...l,customIconAssetId:asset.id,iconUrl:asset.url});setIconAsset(asset.id);}}/>}
    {<Choice label="Social network / brand icon" value={l.socialNetwork??"AUTO"} options={["AUTO",...networks]} onChange={socialNetwork=>set({...l,socialNetwork:socialNetwork==="AUTO"?null:socialNetwork,type:socialNetwork==="AUTO"?l.type:["YOUTUBE","LINKEDIN","X"].includes(socialNetwork)?"CUSTOM":socialNetwork as LinkType})}/>}
    <div className="flex gap-2"><SaveDomain dirty={JSON.stringify(l)!==JSON.stringify(initial)} onSave={async()=>{submittedLink.current=l;const ok=await mutate({op:"link-save",id:l.id||null,data:{type:l.type,label:l.label??"",value:l.url,isActive:initial.isActive},presentation:presentation(l)});if(ok)onClose();return ok;}}>Save link</SaveDomain>
      <Button type="button" variant="secondary" onClick={()=>{setLocal(initial);submittedLink.current=null;if(iconAsset)void fetch(`/api/admin/businesses/${organizationId}/v2/assets?assetId=${encodeURIComponent(iconAsset)}`,{method:"DELETE"});onClose();}}>Cancel</Button></div>
  </div>;
}
export function V2LinksEditor({data,sectionId,organizationId,mutate,busy,onPreview}:{onPreview?:(link:V2Link|null,id:string)=>void;data:V2Data;sectionId:string|null;organizationId:string;mutate:MutateV2;busy:boolean}) {
  const [expanded,setExpanded]=useState<string|null>(null);
  const [visited,setVisited]=useState<string[]>([]);
  const [newKey,setNewKey]=useState(0);
  const open=(id:string)=>{setExpanded(current=>current===id?null:id);setVisited(ids=>ids.includes(id)?ids:[...ids,id]);};
  const links=data.links.filter(l=>l.socialSectionId===sectionId);
  const socials=data.sections.find(s=>s.kind==="SOCIALS");
  const initial:V2Link={id:"",type:sectionId?"INSTAGRAM":"CUSTOM",label:"",url:"",isActive:true,width:"FULL",iconMode:"DEFAULT",v2IsVisible:true,customIconAssetId:null,iconUrl:null,socialSectionId:sectionId,socialNetwork:sectionId?"INSTAGRAM":null};
  const form=(l:V2Link)=><LinkForm key={l.id||newKey} onPreview={value=>onPreview?.(value,l.id||`new-${sectionId||"links"}`)} initial={l} organizationId={organizationId} mutate={mutate} busy={busy} onClose={()=>{onPreview?.(null,l.id||`new-${sectionId||"links"}`);if(!l.id)setNewKey(k=>k+1);setExpanded(null);}}/>;
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
