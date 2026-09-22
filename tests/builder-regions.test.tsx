import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {ProfileBuilderShell} from "@/components/admin/ProfileBuilderShell";
import {ProfileSettingsPanel} from "@/components/admin/profile-builder/ProfileSettingsPanel";
import {ProfileRenderer} from "@/components/profile/ProfileRenderer";
import {Field,Choice} from "@/components/admin/profile-builder/V2Controls";
import {ToastProvider} from "@/components/ui/Toast";
import {itemConfigs,itemKinds,type V2Data,type V2Section,type V2Link} from "@/lib/profile-v2";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("next/image",()=>({default:()=>null}));
const section=(key:string):V2Section=>({id:key,kind:key==="SOCIALS"?"SOCIALS":"CORE",singletonKey:key,internalName:key,visibleTitle:null,position:0,isVisible:true,config:{},items:[]});
const link=(id:string,socialSectionId:string|null):V2Link=>({id,type:"CUSTOM",label:id,url:"https://example.com",isActive:true,width:"FULL",iconMode:"DEFAULT",v2IsVisible:true,customIconAssetId:null,iconUrl:null,socialSectionId,socialNetwork:null});
const data:V2Data={version:2,revision:0,theme:"CLASSIC",links:[link("Example link",null),link("Example social","SOCIALS")],sections:[...['BIO','BUSINESS_INFO','LINKS','MENU','SOCIALS'].map(section),{...section("Custom"),kind:"CUSTOM",singletonKey:null,items:itemKinds.map((kind,position)=>({id:kind,kind,position,width:"FULL",isVisible:true,config:itemConfigs[kind].parse({}),referencedProfileLinkId:null,images:[]}))}]};
const business={name:"Example",businessType:null,v2:data,profile:{displayName:"Example",bio:"Biography",phone:null,email:null,whatsapp:null,website:null,address:null,googleMapsUrl:null,logoUrl:null,coverImageUrl:null,backgroundImageUrl:null,themeColor:null,backgroundType:"SOLID" as const,backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT" as const,links:[]}};
let tree:TestRenderer.ReactTestRenderer;const fetchMock=vi.fn();
beforeEach(()=>{vi.stubGlobal("fetch",fetchMock);vi.stubGlobal("window",{matchMedia:()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()})});fetchMock.mockReset();});
afterEach(()=>{if(tree)act(()=>tree.unmount());vi.unstubAllGlobals();});
async function mount(){await act(async()=>{tree=TestRenderer.create(<ToastProvider><ProfileBuilderShell organizationId="test" businessSlug="example" business={business} initialBlocks={[]} menuAvailable={false} isMenuEnabled={false} menu={null} adminPanel={<p>Admin</p>}/></ToastProvider>);});}
const region=(name:string)=>tree.root.findByProps({"data-builder-region":name});
function text(node:TestRenderer.ReactTestInstance):string{return node.children.map(c=>typeof c==="string"?c:text(c)).join("");}
async function select(label:string){const button=region("structure").findAllByType("button").find(n=>n.props['aria-pressed']!==undefined&&text(n).startsWith(label));if(button){await act(async()=>button.props.onClick());return;}const item=region("editor").findAllByType("button").find(n=>visible(n)&&n.props["aria-expanded"]!==undefined&&text(n).startsWith(label));expect(item).toBeDefined();if(!item!.props["aria-expanded"])await act(async()=>item!.props.onClick());}
function visible(n:TestRenderer.ReactTestInstance):boolean{return !n.props.hidden&&(!n.parent||visible(n.parent));}
function assertBoundary(){expect(region("structure").findAllByType("input")).toHaveLength(0);expect(region("structure").findAllByType("textarea")).toHaveLength(0);expect(region("structure").findAllByType("select")).toHaveLength(0);expect(tree.root.findAllByType(ProfileRenderer)).toHaveLength(1);expect(tree.root.findAllByType(ProfileSettingsPanel)).toHaveLength(1);expect(region("preview").findAllByType(ProfileRenderer)).toHaveLength(1);}
describe("actual Builder tree with actual sortable rows and public renderer",()=>{
  it("keeps a Link draft when visiting section settings and returning to content",async()=>{
    await mount();await select("LINKS");await select("Example link");
    const label=()=>region("editor").findAllByType(Field).find(n=>visible(n)&&n.props.label==="Label")!;
    await act(async()=>label().props.onChange("Keep this draft"));
    const row=region("structure").findAllByType("li").find(n=>n.props["data-selected"]===true)!;
    await act(async()=>row.findAllByType("button").find(n=>text(n)==="Section settings")!.props.onClick());
    await select("LINKS");expect(label().props.value).toBe("Keep this draft");
  });
  it("visibility saves do not publish or discard an unsaved section heading",async()=>{
    await mount();await select("LINKS");
    const row=region("structure").findAllByType("li").find(n=>n.props["data-selected"]===true)!;
    await act(async()=>row.findAllByType("button").find(n=>text(n)==="Section settings")!.props.onClick());
    const heading=()=>region("editor").findAllByType(Field).find(n=>visible(n)&&n.props.label==="Visible heading (optional)")!;
    await act(async()=>heading().props.onChange("Unpublished heading"));
    fetchMock.mockResolvedValue({ok:true,json:async()=>({v2:{...data,revision:1,sections:data.sections.map(s=>s.id==="LINKS"?{...s,isVisible:false}:s)}})});
    await act(async()=>region("structure").findByProps({role:"switch","aria-label":"Hide LINKS"}).props.onClick());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).command.data.visibleTitle).toBeNull();
    expect(heading().props.value).toBe("Unpublished heading");
    expect(region("structure").findByProps({role:"switch","aria-label":"Show LINKS"}).props["aria-checked"]).toBe(false);
  });
  it.each(["LINKS","SOCIALS","Custom"])("%s collection starts collapsed in the center and secondary settings require an explicit action",async label=>{
    await mount();await select(label);
    expect(region("structure").findAllByProps({"data-collection-editor":true})).toHaveLength(0);
    const rows=region("editor").findAllByType("button").filter(n=>visible(n)&&n.props["aria-expanded"]!==undefined);
    expect(rows.length).toBeGreaterThan(0);expect(rows.every(n=>n.props["aria-expanded"]===false)).toBe(true);
    expect(region("editor").findAllByType(Field).filter(n=>visible(n)&&n.props.label==="Visible heading (optional)")).toHaveLength(0);
    const selected=region("structure").findAllByType("li").find(n=>n.props["data-selected"]===true)!;
    expect(selected).toBeDefined();expect(selected.findAllByProps({role:"switch"})).toHaveLength(1);
    const settings=selected.findAllByType("button").find(n=>text(n).includes("settings")||text(n).includes("Settings"))!;
    await act(async()=>settings.props.onClick());
    expect(region("editor").findAllByType(Field).filter(n=>visible(n)&&n.props.label==="Visible heading (optional)")).toHaveLength(1);
  });
  it.each(["BIO","BUSINESS_INFO","MENU"])("keeps %s settings in the central editor",async label=>{await mount();await select(label);assertBoundary();expect(region("editor").findAllByType("button").length).toBeGreaterThan(0);});
  it("persists a fast link toggle through the real shell request and response",async()=>{
    await mount();await select("LINKS");
    fetchMock.mockResolvedValue({ok:true,json:async()=>({v2:{...data,revision:1,links:data.links.map(l=>l.id==="Example link"?{...l,isActive:false}:l)}})});
    await act(async()=>region("editor").findByProps({role:"switch","aria-label":"Active Example link"}).props.onClick());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({command:{op:"link-save",id:"Example link",data:{isActive:false}}});
    expect(region("editor").findByProps({role:"switch","aria-label":"Active Example link"}).props["aria-checked"]).toBe(false);
  });
  it.each([["LINKS","Example link"],["SOCIALS","Example social"]])("edits %s only in the central region and restores fast switches",async(sectionId,label)=>{
    await mount();await select(sectionId);const toggle=region("editor").findByProps({role:"switch","aria-label":`Active ${label}`});expect(toggle.props['aria-checked']).toBe(true);
    await select(label);assertBoundary();const editor=region("editor").findAllByType(Field).find(n=>visible(n)&&n.props.label==="Label")!;expect(editor.props.value).toBe(label);
    await act(async()=>editor.props.onChange("Draft"));await select("BIO");await select(sectionId);await select(label);expect(region("editor").findAllByType(Field).find(n=>visible(n)&&n.props.label==="Label")!.props.value).toBe("Draft");expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(itemKinds)("selects Custom %s centrally without mounting editors in Structure",async kind=>{await mount();await select("Custom");await select(kind==="MENU"?"View Menu":kind==="LINK"?"Link":kind==="MAP"?"Directions":kind==="REVIEW"?"Google Reviews":kind==="SOCIAL"?"Social":kind);assertBoundary();expect(region("editor").findAllByType("h4").filter(visible).map(text)).toContain(kind.replaceAll("_"," "));});
  it("sends Heading alignment to the one real renderer",async()=>{await mount();await select("Custom");await select("HEADING");const fields=()=>region("editor");await act(async()=>fields().findAllByType(Field).find(n=>visible(n)&&n.props.label==="Text")!.props.onChange("Centered heading"));await act(async()=>fields().findAllByType(Choice).find(n=>visible(n)&&n.props.label==="Alignment")!.props.onChange("CENTER"));const heading=region("preview").findAllByType("h3").find(n=>text(n)==="Centered heading")!;expect(heading.parent!.props.style.textAlign).toBe("center");assertBoundary();});
  it("preserves section switch API semantics",async()=>{await mount();fetchMock.mockResolvedValue({ok:true,json:async()=>({v2:{...data,revision:1,sections:data.sections.map(s=>s.id==="BIO"?{...s,isVisible:false}:s)}})});await act(async()=>{region("structure").findByProps({role:"switch","aria-label":"Hide BIO"}).props.onClick();});expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({command:{op:"section-update",id:"BIO",data:{isVisible:false}}});expect(region("structure").findByProps({role:"switch","aria-label":"Show BIO"}).props['aria-checked']).toBe(false);});
});
