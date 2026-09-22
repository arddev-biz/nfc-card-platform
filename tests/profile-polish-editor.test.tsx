import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {ProfileBuilderShell} from "@/components/admin/ProfileBuilderShell";
import {ProfileRenderer} from "@/components/profile/ProfileRenderer";
import {V2Structure} from "@/components/admin/profile-builder/V2Editor";
import {Field} from "@/components/admin/profile-builder/V2Controls";
import {GlobalDesignControls} from "@/components/admin/profile-builder/GlobalDesignControls";
import {ToastProvider} from "@/components/ui/Toast";
import {profileDesign} from "@/lib/profile-design";
import type {V2Data,V2Link} from "@/lib/profile-v2";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("@/components/profile/ProfileRenderer",()=>({ProfileRenderer:()=>null}));
vi.mock("@/components/admin/profile-builder/SortableList",()=>({SortableList:({items,children}:{items:{id:string}[];children:(i:{id:string},controls:{move:()=>void;first:boolean;last:boolean})=>React.ReactNode})=><ul>{items.map((i,index)=><li key={i.id}>{children(i,{move:vi.fn(),first:index===0,last:index===items.length-1})}</li>)}</ul>}));
const link=(id:string):V2Link=>({id,type:"CUSTOM",label:id,url:`https://example.com/${id}`,isActive:true,width:"FULL",iconMode:"DEFAULT",v2IsVisible:true,customIconAssetId:null,iconUrl:null,socialSectionId:null,socialNetwork:null});
const data:V2Data={version:2,revision:0,theme:"CLASSIC",links:[link("first"),link("second")],sections:[
  {id:"links",kind:"CORE",singletonKey:"LINKS",internalName:"Links",visibleTitle:null,position:0,isVisible:true,config:{},items:[]},
  {id:"custom",kind:"CUSTOM",singletonKey:null,internalName:"Gallery",visibleTitle:null,position:1,isVisible:true,config:{},items:[{id:"text",kind:"TEXT",position:0,isVisible:true,width:"HALF",config:{text:"Initial text"},referencedProfileLinkId:null,images:[]}]},
]};
const business={name:"Test",businessType:null,v2:data,profile:{displayName:"Test",bio:null,phone:null,email:null,whatsapp:null,website:null,address:null,googleMapsUrl:null,logoUrl:null,coverImageUrl:null,backgroundImageUrl:null,themeColor:null,backgroundType:"SOLID" as const,backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT" as const,links:[]}};
const request=vi.fn(),confirm=vi.fn();let tree:TestRenderer.ReactTestRenderer;
beforeEach(()=>{vi.resetAllMocks();vi.stubGlobal("fetch",request);vi.stubGlobal("window",{confirm});});
afterEach(()=>{if(tree)act(()=>tree.unmount());vi.unstubAllGlobals();});
async function mount(){await act(async()=>{tree=TestRenderer.create(<ToastProvider><ProfileBuilderShell organizationId="org" businessSlug="test" business={business} initialBlocks={[]} menuAvailable={false} isMenuEnabled={false} menu={null} adminPanel={<div/>}/></ToastProvider>);});}
function visible(node:TestRenderer.ReactTestInstance):boolean {return !node.props.hidden&&(!node.parent||visible(node.parent));}
function field(label:string){return tree.root.findAllByType(Field).find(n=>visible(n)&&n.props.label===label)!;}
function button(label:string){return tree.root.findAllByType("button").find(n=>visible(n)&&n.children.join("")===label)!;}
const preview=()=>tree.root.findByType(ProfileRenderer).props.business;
async function select(sectionId:string,kind:"link"|"item",id:string){await act(async()=>tree.root.findByType(V2Structure).props.onSelect(sectionId));const label=kind==="item"?String(preview().v2.sections.find((s:{id:string})=>s.id===sectionId).items.find((i:{id:string})=>i.id===id).config.text):id;const row=tree.root.findAllByType("button").find(n=>visible(n)&&n.props["aria-expanded"]!==undefined&&n.children[0]===label)!;if(!row.props["aria-expanded"])await act(async()=>row.props.onClick());}
describe("selection-based central editor",()=>{
  it("edits only the selected link and retains its unsaved draft across selection",async()=>{
    await mount();await select("links","link","first");expect(field("Label").props.value).toBe("first");
    await act(async()=>field("Label").props.onChange("Unsaved first"));expect(preview().v2.links[0].label).toBe("Unsaved first");
    await select("links","link","second");expect(field("Label").props.value).toBe("second");
    await select("links","link","first");expect(field("Label").props.value).toBe("Unsaved first");
    expect(tree.root.findAllByType(Field).filter(n=>visible(n)&&n.props.label==="Label")).toHaveLength(1);
    expect(request).not.toHaveBeenCalled();
  });
  it("cancels link drafts without leaving an unpublished preview behind",async()=>{
    await mount();await select("links","link","first");await act(async()=>field("Label").props.onChange("Discard me"));
    await act(async()=>button("Cancel").props.onClick());expect(preview().v2.links[0].label).toBe("first");
    await select("links","link","first");expect(field("Label").props.value).toBe("first");
  });
  it("saves the selected link through the shell and displays persisted values",async()=>{
    await mount();await select("links","link","first");await act(async()=>field("Label").props.onChange("Saved label"));
    request.mockResolvedValue({ok:true,json:async()=>({v2:{...data,revision:1,links:[{...link("first"),label:"Saved label"},link("second")]}})});
    await act(async()=>{await button("Save Changes").props.onClick();});
    expect(JSON.parse(request.mock.calls[0][1].body)).toMatchObject({revision:0,command:{op:"link-save",id:"first",data:{label:"Saved label"}}});
    expect(preview().v2.links[0].label).toBe("Saved label");
  });
  it("places a selected Custom item in the editor without expanding every item",async()=>{
    await mount();await select("custom","item","text");expect(field("Text").props.value).toBe("Initial text");
    await act(async()=>field("Text").props.onChange("Draft item"));
    await select("links","link","first");await select("custom","item","text");
    expect(field("Text").props.value).toBe("Draft item");expect(preview().v2.sections[1].items[0].config.text).toBe("Draft item");
  });
  it("requires named confirmation before deleting a Custom section",async()=>{
    await mount();confirm.mockReturnValue(false);
    const structure=tree.root.findByType(V2Structure);
    const remove=structure.findAllByType("button").find(n=>n.children.join("")==="Delete section")!;
    await act(async()=>remove.props.onClick());expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Gallery"));expect(request).not.toHaveBeenCalled();
    expect(structure.findAllByType("button").filter(n=>n.children.join("")==="Delete section")).toHaveLength(1);
  });
  it("previews global design immediately and explicitly saves the validated design command",async()=>{
    await mount();const design=profileDesign.parse({theme:"DIMENSIONAL",radius:"PILL",density:"SPACIOUS"});
    await act(async()=>tree.root.findByType(GlobalDesignControls).props.onChange(design));
    expect(preview().v2.design).toEqual(design);expect(request).not.toHaveBeenCalled();
    request.mockResolvedValue({ok:true,json:async()=>({v2:{...data,revision:1,theme:"DIMENSIONAL",design}})});
    const save=tree.root.findAllByType("button").find(n=>n.children.join("")==="Save Changes")!;
    await act(async()=>{await save.props.onClick();});expect(JSON.parse(request.mock.calls[0][1].body).command).toEqual({op:"design",data:design});
  });
});
