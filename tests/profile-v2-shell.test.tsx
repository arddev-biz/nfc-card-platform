import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import TestRenderer, { act } from "react-test-renderer";
import { ProfileBuilderShell } from "@/components/admin/ProfileBuilderShell";
import { ProfileSettingsPanel } from "@/components/admin/profile-builder/ProfileSettingsPanel";
import { BioEditor } from "@/components/admin/profile-builder/BlockEditors";
import { V2Structure, V2SectionEditor, BusinessInfoEditor } from "@/components/admin/profile-builder/V2Editor";
import { ProfileRenderer } from "@/components/profile/ProfileRenderer";
import { ToastProvider } from "@/components/ui/Toast";
import type { V2Data } from "@/lib/profile-v2";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("@/components/profile/ProfileRenderer",()=>({ProfileRenderer:()=>null}));
vi.mock("@/components/admin/profile-builder/SortableList",()=>({SortableList:()=>null}));
const initial:V2Data={version:2,revision:0,theme:"CLASSIC",links:[],sections:[
  {id:"bio",kind:"CORE",singletonKey:"BIO",internalName:"Bio",visibleTitle:null,position:0,isVisible:true,config:{},items:[]},
  {id:"info",kind:"CORE",singletonKey:"BUSINESS_INFO",internalName:"Business Info",visibleTitle:null,position:1,isVisible:true,config:{phone:true},items:[]},
  {id:"custom",kind:"CUSTOM",singletonKey:null,internalName:"Gallery",visibleTitle:null,position:2,isVisible:true,config:{},items:[]},
]};
const business={name:"Test",businessType:null,v2:initial,profile:{displayName:"Test",bio:"Test Bio",phone:null,email:null,whatsapp:null,website:null,address:null,googleMapsUrl:null,logoUrl:null,coverImageUrl:null,backgroundImageUrl:null,themeColor:null,backgroundType:"SOLID" as const,backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT" as const,links:[]}};
let renderer:TestRenderer.ReactTestRenderer;
const request=vi.fn();
beforeEach(()=>{vi.resetAllMocks();vi.stubGlobal("fetch",request);});
afterEach(()=>{if(renderer)act(()=>renderer.unmount());vi.unstubAllGlobals();});
async function mount(){await act(async()=>{renderer=TestRenderer.create(<ToastProvider><ProfileBuilderShell organizationId="org" businessSlug="test" business={business} initialBlocks={[]} menuAvailable={false} isMenuEnabled={false} menu={null} adminPanel={<div>Admin</div>}/></ToastProvider>);});}
const preview=()=>renderer.root.findByType(ProfileRenderer).props;
describe("actual mounted V2 shell state/save path",()=>{
  it("retains exactly one Bio/settings tree when selecting repeatable sections",async()=>{
    await mount();const bio=renderer.root.findByType(BioEditor);
    await act(async()=>bio.findByType("textarea").props.onChange({target:{value:"Draft Bio"}}));
    await act(async()=>renderer.root.findByType(V2Structure).props.onSelect("custom"));
    expect(renderer.root.findAllByType(BioEditor)).toHaveLength(1);
    expect(renderer.root.findByType(BioEditor)).toBe(bio);
    expect(renderer.root.findAllByType(ProfileSettingsPanel)).toHaveLength(1);
    expect(preview().business.profile.bio).toBe("Draft Bio");
  });
  it("saves explicit null from the actual Bio textarea and preserves the empty preview",async()=>{
    await mount();request.mockResolvedValue({ok:true,json:async()=>({profile:{...business.profile,bio:null}})});
    const bio=renderer.root.findByType(BioEditor);
    await act(async()=>bio.findByType("textarea").props.onChange({target:{value:""}}));
    await act(async()=>{await renderer.root.findAllByType("button").find(button=>button.children.includes("Save Changes"))!.props.onClick();});
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({bio:null});expect(preview().business.profile.bio).toBeNull();
  });
  it("persists canonical section IDs/revision and reconciles returned order",async()=>{
    await mount();const next={...initial,revision:1,sections:[...initial.sections].reverse().map((s,position)=>({...s,position}))};
    request.mockResolvedValue({ok:true,json:async()=>({v2:next})});
    await act(async()=>{await renderer.root.findByType(V2Structure).props.mutate({op:"section-order",orderedIds:["custom","info","bio"]});});
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({revision:0,command:{op:"section-order",orderedIds:["custom","info","bio"]}});
    expect(preview().viewModel.v2Sections.map((s:{id:string})=>s.id)).toEqual(["custom","info","bio"]);
  });
  it("does not claim success on a rejected save",async()=>{
    await mount();request.mockResolvedValue({ok:false,json:async()=>({error:"Stale revision"})});
    await act(async()=>{await renderer.root.findByType(V2Structure).props.mutate({op:"theme",theme:"LIQUID_GLASS"});});
    expect(JSON.stringify(renderer.toJSON())).toContain("Stale revision");expect(preview().business.v2.theme).toBe("CLASSIC");
  });
  it("applies persisted visibility even when the request deliberately differs from the local toggle state",async()=>{
    await mount();
    request.mockResolvedValue({ok:true,json:async()=>({v2:{...initial,revision:1,sections:initial.sections.map(s=>s.id==="bio"?{...s,isVisible:false}:s)}})});
    await act(async()=>{await renderer.root.findByType(V2Structure).props.mutate({op:"section-update",id:"bio",data:{internalName:"Bio",visibleTitle:null,isVisible:false,config:{}}});});
    expect(preview().viewModel.v2Sections.some((s:{id:string})=>s.id==="bio")).toBe(false);
    expect(renderer.root.findByType(V2Structure).props.data.sections[0].isVisible).toBe(false);
  });
  it("keeps another section draft when a different section saves",async()=>{
    await mount();const editors=renderer.root.findAllByType(V2SectionEditor);
    await act(async()=>editors.find(e=>e.props.section.id==="custom")!.props.preview({...initial.sections[2],visibleTitle:"Unsaved gallery"}));
    request.mockResolvedValue({ok:true,json:async()=>({v2:{...initial,revision:1}})});
    await act(async()=>{await renderer.root.findByType(V2Structure).props.mutate({op:"theme",theme:"CLASSIC"});});
    expect(preview().business.v2.sections.find((s:{id:string})=>s.id==="custom").visibleTitle).toBe("Unsaved gallery");
  });
  it("updates Business Info preview without a request until saved",async()=>{
    await mount();
    const editor=renderer.root.findByType(BusinessInfoEditor);
    await act(async()=>editor.props.onPreview({phone:"+355691234567",email:"",address:"",googleMapsUrl:"",website:"",whatsapp:""}));
    expect(preview().viewModel.callHref).toBe("tel:+355691234567");expect(request).not.toHaveBeenCalled();
  });
});
