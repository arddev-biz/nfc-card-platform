import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {BuilderV3} from "@/components/admin/profile-builder/BuilderV3";
import {CustomContentDraftEditor} from "@/components/admin/profile-builder/CustomContentDraftEditor";
import {EssentialDesignEditor} from "@/components/admin/profile-builder/EssentialDesignEditor";
import {EssentialSectionAppearance,EssentialText} from "@/components/admin/profile-builder/EssentialAppearance";
import {Field,Upload} from "@/components/admin/profile-builder/V2Controls";
import {VisualChoice} from "@/components/admin/profile-builder/VisualControls";
import {SortableList} from "@/components/admin/profile-builder/SortableList";
import {ProfileRenderer} from "@/components/profile/ProfileRenderer";
import {ToastProvider} from "@/components/ui/Toast";
import {builderDraftSchema} from "@/lib/profile-builder-draft";
import {profileDesign} from "@/lib/profile-design";
import type {V2Data,V2Item} from "@/lib/profile-v2";
vi.mock("@/components/profile/ProfileRenderer",()=>({ProfileRenderer:()=>null}));
vi.mock("@/components/admin/profile-builder/SortableList",()=>({SortableList:({items,children}:{items:{id:string}[];children:(item:unknown)=>React.ReactNode})=><div>{items.map(item=><div key={item.id}>{children(item)}</div>)}</div>}));
vi.mock("next/image",()=>({default:(props:object)=><img {...props}/>}));
const initial:V2Data={version:2,revision:0,theme:"CLASSIC",design:profileDesign.parse({}),links:[],sections:[{id:"custom",kind:"CUSTOM",singletonKey:null,internalName:"Custom",visibleTitle:null,position:0,isVisible:true,config:{},items:[]}]};
const business={name:"Test",businessType:null,v2:initial,profile:{displayName:"Test",bio:"",phone:null,email:null,whatsapp:null,website:null,address:null,googleMapsUrl:null,logoUrl:null,coverImageUrl:null,backgroundImageUrl:null,themeColor:null,backgroundType:"SOLID" as const,backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT" as const,links:[]}};
let tree:TestRenderer.ReactTestRenderer;
const request=vi.fn();
const txt=(n:TestRenderer.ReactTestInstance):string=>n.children.map(c=>typeof c==="string"?c:txt(c)).join("");
const click=async(label:string)=>{await act(async()=>{tree.root.findAllByType("button").find(n=>txt(n).includes(label))!.props.onClick()})};
beforeEach(()=>{vi.stubGlobal("window",{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true});vi.stubGlobal("document",{addEventListener:vi.fn(),removeEventListener:vi.fn()});vi.stubGlobal("fetch",request);request.mockReset()});
afterEach(()=>{if(tree)act(()=>tree.unmount());vi.unstubAllGlobals()});
async function mount(){await act(async()=>{tree=TestRenderer.create(<ToastProvider><BuilderV3 organizationId="org" businessSlug="test" business={business} menuAvailable={false} menu={null}/></ToastProvider>)})}

it("edits canonical Business Type in the local draft and saves only through Save Changes",async()=>{
  await mount();await click("Header");
  const field=tree.root.findAllByType("label").find(n=>txt(n).startsWith("Business Type"))!.findByType("input");
  await act(async()=>field.props.onChange({target:{value:"Restaurant"}}));
  expect(tree.root.findByType(ProfileRenderer).props.business.businessType).toBe("Restaurant");expect(request).not.toHaveBeenCalled();
  request.mockResolvedValue({ok:true,json:async()=>({v2:{...initial,revision:1},menu:null})});await click("Save Changes");
  const payload=builderDraftSchema.parse(JSON.parse(request.mock.calls[0][1].body));expect(payload.businessType).toBe("Restaurant");expect(payload.profile).not.toHaveProperty("businessType");
});
it("adds all five types, edits/reorders media and metadata, and serializes only on Save Changes",async()=>{
  await mount();
  for(const kind of ["HEADING","TEXT","LINK","IMAGE","CAROUSEL"]){
    await act(async()=>tree.root.findByType(CustomContentDraftEditor).findAllByType("select").find(node=>node.props.value&&node.props.onChange&&node.findAllByType("option").some(option=>option.props.value==="HEADING"))!.props.onChange({target:{value:kind}}));await click("Add content");
  }
  let editor=tree.root.findByType(CustomContentDraftEditor);
  expect(editor.props.items.map((i:V2Item)=>i.kind)).toEqual(["HEADING","TEXT","LINK","IMAGE","CAROUSEL"]);
  for(const label of ["Add image","Add gallery images","Add gallery images"]){await act(async()=>{await tree.root.findAllByType(Upload).find(n=>n.props.label===label)!.props.onUploaded({id:`asset-${label}-${Math.random()}`,url:"https://example.com/image.png"})})}
  await act(async()=>tree.root.findAllByType(Field).find(n=>n.props.label==="Alt text")!.props.onChange("Accessible photo"));
  await act(async()=>tree.root.findAllByType(Field).find(n=>n.props.label==="Caption")!.props.onChange("Caption"));
  await act(async()=>tree.root.findAllByType(Field).find(n=>n.props.label==="Image destination URL")!.props.onChange("https://example.com/destination"));
  await act(async()=>tree.root.findAllByType(Upload).find(n=>n.props.label==="Replace image")!.props.onUploaded({id:"replacement",url:"https://example.com/replacement.png"}));
  for(const layout of ["CAROUSEL","GRID","ROW","FEATURED"]){await act(async()=>tree.root.findAllByType(VisualChoice).find(n=>n.props.label==="Gallery layout")!.props.onChange(layout))}
  const gallery=tree.root.findAllByType(SortableList).find(n=>n.props.items.length===2)!;
  await act(async()=>gallery.props.onOrder([...gallery.props.items].reverse()));
  editor=tree.root.findByType(CustomContentDraftEditor);
  const itemsList=editor.findAllByType(SortableList).find(n=>n.props.items.length===5)!;
  await act(async()=>itemsList.props.onOrder([...itemsList.props.items].reverse()));
  expect(request).not.toHaveBeenCalled();
  const draft=tree.root.findByType(ProfileRenderer).props.business.v2;
  expect(draft.sections[0].items[0].config.media.layout).toBe("FEATURED");
  const photo=draft.sections[0].items.find((i:V2Item)=>i.kind==="IMAGE").images[0];
  expect(photo).toMatchObject({assetId:"replacement",alt:"Accessible photo",caption:"Caption",destinationUrl:"https://example.com/destination"});
  request.mockResolvedValue({ok:true,json:async()=>({v2:{...draft,revision:1},menu:null})});await click("Save Changes");
  const payload=builderDraftSchema.parse(JSON.parse(request.mock.calls[0][1].body));
  expect(payload.sections[0].items[0].kind).toBe("CAROUSEL");expect(payload.sections[0].items[1].images[0].alt).toBe("Accessible photo");
});
it("deletes images/items/sections locally without deleting canonical data",async()=>{
  await mount();await click("Add content");await click("Delete item");expect(tree.root.findByType(CustomContentDraftEditor).props.items).toHaveLength(0);
  await click("Delete section");expect(tree.root.findByType(ProfileRenderer).props.business.v2.sections).toHaveLength(0);expect(request.mock.calls.filter(call=>call[1]?.method)).toHaveLength(0);
});
it("updates backgrounds and global appearance locally and shows text-appropriate section controls",async()=>{
  await mount();await click("Design");
  const designEditor=()=>tree.root.findByType(EssentialDesignEditor);
  await act(async()=>designEditor().props.onBackgroundChange("https://example.com/bg.png"));
  await act(async()=>designEditor().props.onChange({...initial.design,visual:{version:1,canvas:{background:"GRADIENT",color:"#112233",gradientColor:"#445566"},typography:{name:{font:"SERIF",size:32,weight:"700"},body:{font:"HUMANIST",color:"#123456"}},surface:{variant:"SOLID",color:"#abcdef",radius:24},action:{minHeight:72}}}));
  expect(tree.root.findByType(ProfileRenderer).props.business.profile.backgroundImageUrl).toBe("https://example.com/bg.png");expect(request.mock.calls.filter(call=>call[1]?.method)).toHaveLength(0);
  await click("CustomCustom profile content");await click("Appearance");
  const appearance=tree.root.findByType(EssentialSectionAppearance);
  await act(async()=>appearance.props.onChange({...appearance.props.section,config:{visual:{text:{align:"CENTER"}}}}));
  expect(tree.root.findAllByType(EssentialText)).toHaveLength(0);expect(tree.root.findAllByType(VisualChoice).some(n=>n.props.label==="Section surface")).toBe(true);expect(tree.root.findAllByType(VisualChoice).some(n=>n.props.label==="Button style")).toBe(false);
});

it("keeps Header and Footer Content/Appearance reachable without saving",async()=>{
  await mount();await click("Header");await click("Appearance");
  expect(tree.root.findAllByType(VisualChoice).some(node=>node.props.label==="Header spacing")).toBe(true);
  await click("Content");expect(tree.root.findAllByType("textarea").length).toBeGreaterThan(0);
  await click("Footer");expect(tree.root.findAllByType(Field).some(node=>node.props.label.startsWith("Footer text"))).toBe(true);
  await click("Appearance");expect(tree.root.findAllByType("summary").some(node=>txt(node)==="Customize footer")).toBe(true);
  expect(request).not.toHaveBeenCalled();
});

it("persists background blur only through Save Changes and restores it from saved data",async()=>{
  await mount();await click("Design");
  const savedDesign={...initial.design!,visual:{version:1 as const,canvas:{background:"IMAGE" as const,backgroundBlur:75}}};
  await act(async()=>tree.root.findByType(EssentialDesignEditor).props.onChange(savedDesign));
  expect(tree.root.findByType(ProfileRenderer).props.business.v2.design.visual.canvas.backgroundBlur).toBe(75);
  expect(request.mock.calls.filter(call=>call[1]?.method)).toHaveLength(0);
  const saved={...initial,revision:1,design:savedDesign};request.mockResolvedValue({ok:true,json:async()=>({v2:saved,menu:null})});await click("Save Changes");
  const saveCall=request.mock.calls.find(call=>call[0].endsWith("/builder-save"))!;
  expect(builderDraftSchema.parse(JSON.parse(saveCall[1].body)).design.visual?.canvas?.backgroundBlur).toBe(75);
  act(()=>tree.unmount());await act(async()=>{tree=TestRenderer.create(<ToastProvider><BuilderV3 organizationId="org" businessSlug="test" business={{...business,v2:saved}} menuAvailable={false} menu={null}/></ToastProvider>)});
  expect(tree.root.findByType(ProfileRenderer).props.business.v2.design.visual.canvas.backgroundBlur).toBe(75);
});
it("stores only changed section style properties and preserves inheritance",()=>{
  const onChange=vi.fn();let editor:TestRenderer.ReactTestRenderer;
  const section={...initial.sections[0],kind:"CORE" as const,singletonKey:"LINKS",config:{visual:{}}};
  act(()=>{editor=TestRenderer.create(<EssentialSectionAppearance section={section} global={{version:1,surface:{color:"#ffffff",radius:16},action:{textColor:"#172033",minHeight:60}}} onChange={onChange}/>)});
  act(()=>editor.root.findAllByType(Field).find(node=>node.props.label==="Button text color")!.props.onChange("#123456"));
  expect(onChange.mock.calls[0][0].config.visual).toEqual({action:{textColor:"#123456"}});
  act(()=>editor.unmount());
});
