import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {renderToStaticMarkup} from "react-dom/server";
import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {BuilderV3} from "@/components/admin/profile-builder/BuilderV3";
import {ProfileRenderer} from "@/components/profile/ProfileRenderer";
import {V2SectionContent} from "@/components/profile/V2SectionContent";
import {EssentialSectionAppearance,LinkAppearance} from "@/components/admin/profile-builder/EssentialAppearance";
import {EssentialDesignEditor} from "@/components/admin/profile-builder/EssentialDesignEditor";
import {HeaderVisualControls,ButtonStyle,VisualChoice,ExactNumber} from "@/components/admin/profile-builder/VisualControls";
import {BackgroundEditor} from "@/components/admin/profile-builder/BackgroundEditor";
import {ToastProvider} from "@/components/ui/Toast";
import {profileDesign} from "@/lib/profile-design";
import {backgroundTextContrast,repairBackgroundTextContrast} from "@/lib/profile-presentation";
import {builderDraftErrors,type BuilderSaveDraft} from "@/lib/profile-builder-draft";
import {buildProfileViewModel} from "@/lib/profileView";
import type {V2Data,V2Section,V2Link} from "@/lib/profile-v2";
vi.mock("@/components/profile/ProfileRenderer",()=>({ProfileRenderer:()=>null}));
vi.mock("next/image",()=>({default:()=>null}));
vi.mock("@/components/admin/profile-builder/SortableList",()=>({SortableList:({items,children}:{items:{id:string}[];children:(item:unknown)=>React.ReactNode})=><div>{items.map(item=><div key={item.id}>{children(item)}</div>)}</div>}));
const section=(key:string,position=0):V2Section=>({id:key,kind:key==="SOCIALS"?"SOCIALS":"CORE",singletonKey:key,internalName:key,visibleTitle:null,position,isVisible:true,config:{},items:[]});
const link:V2Link={id:"link",type:"CUSTOM",label:"Order",url:"https://example.com",isActive:true,width:"FULL",iconMode:"DEFAULT",customIconAssetId:null,iconUrl:null,socialSectionId:null,socialNetwork:null,v2IsVisible:true};
const initial:V2Data={version:2,revision:0,theme:"CLASSIC",design:profileDesign.parse({visual:{version:1,canvas:{gap:16,padding:20},hero:{padding:20,gap:8,avatarSize:88},action:{minHeight:56,padding:14},primaryAction:{action:{textColor:"#123456"}}}}),links:[link],sections:[section("MENU"),section("LINKS",1),section("SOCIALS",2)]};
const business={name:"Example",businessType:null,v2:initial,profile:{displayName:"Example",bio:"",phone:null,email:null,whatsapp:null,website:null,address:null,googleMapsUrl:null,logoUrl:null,coverImageUrl:null,backgroundImageUrl:null,themeColor:null,backgroundType:"SOLID" as const,backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT" as const,links:[]}};
let tree:TestRenderer.ReactTestRenderer;
const request=vi.fn(),text=(n:TestRenderer.ReactTestInstance):string=>n.children.map(c=>typeof c==="string"?c:text(c)).join("");
const click=async(label:string)=>act(async()=>tree.root.findAllByType("button").find(n=>text(n).includes(label))!.props.onClick());
beforeEach(()=>{vi.stubGlobal("fetch",request);request.mockReset();vi.stubGlobal("window",{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:()=>true,location:{href:"http://localhost/builder"}});vi.stubGlobal("document",{addEventListener:vi.fn(),removeEventListener:vi.fn()});});
afterEach(()=>{if(tree)act(()=>tree.unmount());vi.unstubAllGlobals();});
async function mount(enabled=true){await act(async()=>{tree=TestRenderer.create(<ToastProvider><BuilderV3 organizationId="org" businessSlug="example" business={business} menuAvailable={false} isMenuEnabled={enabled} menu={null}/></ToastProvider>)});}
it("a Socials carousel drag does not trigger Preview click-to-edit",async()=>{
  await mount();const before=tree.root.findByType(ProfileRenderer).props.selectedSectionId;
  const preventDefault=vi.fn(),stopPropagation=vi.fn();
  act(()=>tree.root.find(n=>n.props.className==="builder-v3-preview-surface").props.onClickCapture({target:{closest:(selector:string)=>selector===".social-icon-row"?{dataset:{socialDragUntil:String(performance.now()+1000)}}:null},preventDefault,stopPropagation}));
  expect(preventDefault).toHaveBeenCalled();expect(stopPropagation).toHaveBeenCalled();expect(tree.root.findByType(ProfileRenderer).props.selectedSectionId).toBe(before);
});
it.each([false,true])("local Menu preview respects module eligibility %s",async enabled=>{
  await mount(enabled);await click("MenuFood");await click("Create Menu");await click("Add Category");await click("Add Item");
  expect(tree.root.findByType(ProfileRenderer).props.menuAvailable).toBe(enabled);expect(request).not.toHaveBeenCalled();
});
it("global rhythm leaves Header, page padding and buttons intact",()=>{
  const change=vi.fn();act(()=>{tree=TestRenderer.create(<EssentialDesignEditor design={initial.design!} onChange={change} organizationId="org" backgroundUrl={null} coverUrl={null} onBackgroundChange={vi.fn()} accent="#123456" onAccentChange={vi.fn()}/>)});
  act(()=>tree.root.findAllByType(VisualChoice).find(n=>n.props.label==="Section spacing")!.props.onChange("24"));
  const next=change.mock.lastCall![0];expect(next.visual.canvas).toMatchObject({gap:24,padding:20});expect(next.visual.hero).toEqual(initial.design!.visual!.hero);expect(next.visual.action).toEqual(initial.design!.visual!.action);
});
it("Social modes clear obsolete section color and outrank inherited theme color",()=>{
  const change=vi.fn(),social={...section("SOCIALS"),config:{visual:{action:{iconColor:"#f7f7f8"}},iconColor:"MONOCHROME"}};
  act(()=>{tree=TestRenderer.create(<EssentialSectionAppearance section={social} global={initial.design!.visual!} onChange={change}/>)});
  act(()=>tree.root.findAllByType("input").find(n=>n.props.type==="checkbox"&&text(n.parent!).includes("Customize this section"))!.props.onChange({target:{checked:true}}));act(()=>tree.root.findAllByType(VisualChoice).find(n=>n.props.label==="Logo color")!.props.onChange("BRAND"));expect(change.mock.lastCall![0].config.visual.action).not.toHaveProperty("iconColor");
  const data={...business,v2:{...initial,design:profileDesign.parse({visual:{version:1,socials:{action:{iconColor:"#f7f7f8"}}}}),links:[{...link,type:"FACEBOOK" as const,url:"https://facebook.com/example",socialSectionId:"SOCIALS",socialNetwork:"FACEBOOK"}]}};
  const html=(config:Record<string,unknown>)=>renderToStaticMarkup(<V2SectionContent section={{...social,config}} business={data} viewModel={buildProfileViewModel(data)} menuAvailable={false} slug="example"/>);
  expect(html({iconColor:"BRAND"}).toLowerCase()).toContain("#1877f2");expect(html({iconColor:"THEME"})).toContain("var(--v2-accent)");expect(html({iconColor:"BRAND",linkStyles:{link:{action:{iconColor:"#ff0000"}}}})).toContain("#ff0000");
});
it("Menu-first receives primary action; unavailable Menu does not consume Link styling",()=>{
  const html=(key:string,available:boolean)=>renderToStaticMarkup(<V2SectionContent section={initial.sections.find(s=>s.id===key)!} business={business} viewModel={buildProfileViewModel(business)} menuAvailable={available} slug="example"/>);
  expect(html("MENU",true)).toContain("#123456");expect(html("LINKS",true)).not.toContain("#123456");expect(html("LINKS",false)).toContain("#123456");
});
it("contrast repair is explicit and never guesses photo pixels",()=>{
  const d=profileDesign.parse({backgroundPreset:"MIDNIGHT",visual:{version:1,canvas:{background:"EXISTING"},hero:{tagline:"Keep"},typography:{body:{color:"#183047",font:"SERIF"},name:{color:"#183047"}},action:{textColor:"#abcdef"}}});
  const before=JSON.stringify(d);expect(backgroundTextContrast(d)?.low).toBe(true);expect(JSON.stringify(d)).toBe(before);const repaired=repairBackgroundTextContrast(d);expect(backgroundTextContrast(repaired)?.low).toBe(false);expect(repaired.visual!.typography!.body).toMatchObject({color:"#f5f7fc",font:"SERIF"});expect(repaired.visual!.action).toEqual(d.visual!.action);expect(repaired.visual!.hero).toEqual(d.visual!.hero);expect(backgroundTextContrast({...d,visual:{...d.visual!,canvas:{background:"IMAGE"}}})).toBeNull();
});
it("Header border fields remain editable without rounding saved photo size",()=>{
  const change=vi.fn();act(()=>{tree=TestRenderer.create(<HeaderVisualControls value={initial.design!} onChange={change}/>)});expect(tree.root.findAllByType(VisualChoice).find(n=>n.props.label==="Logo / profile image size")!.props.value).toBe("CUSTOM");expect(tree.root.findAllByType(ExactNumber).find(n=>n.props.label==="Logo / profile image size")!.props.value).toBe(88);act(()=>tree.root.findAllByType(VisualChoice).find(n=>n.props.label==="Logo border")!.props.onChange("4"));expect(change.mock.lastCall![0].visual.hero).toMatchObject({avatarBorder:4,avatarSize:88});expect(tree.root.findAllByType(VisualChoice).map(n=>n.props.label)).toContain("Space between identity elements");
});
it("Photo Advanced writes existing fit, shading and focal fields",()=>{
  const change=vi.fn();act(()=>{tree=TestRenderer.create(<BackgroundEditor design={profileDesign.parse({visual:{version:1,canvas:{background:"IMAGE"}}})} onChange={change} organizationId="org" backgroundUrl={null} coverUrl={null} onBackgroundChange={vi.fn()}/>)});for(const [label,value,key] of [["Photo shading",60,"overlayOpacity"],["Photo horizontal position",35,"focalX"],["Photo vertical position",75,"focalY"]] as const){act(()=>tree.root.findAllByType(ExactNumber).find(n=>n.props.label===label)!.props.onChange(value));expect(change.mock.lastCall![0].visual.canvas[key]).toBe(value);}
});
it("link appearance persists only changed properties",()=>{
  const change=vi.fn();act(()=>{tree=TestRenderer.create(<LinkAppearance value={{action:{chevron:false}}} global={{surface:{color:"#ffffff",radius:16},action:{padding:14,minHeight:56}}} onChange={change}/>)});const style=tree.root.findByType(ButtonStyle);act(()=>style.props.onChange({...style.props.value,surface:{...style.props.value.surface,color:"#ff0000"}}));expect(change).toHaveBeenLastCalledWith({action:{chevron:false},surface:{color:"#ff0000"}});
});
it("style reset preserves supporting content in the shared draft",async()=>{
  await mount();await click("Order");await click("Appearance");act(()=>tree.root.findByType(LinkAppearance).props.onChange({subtitle:"Keep this content",surface:{color:"#ff0000"}}));act(()=>tree.root.findByType(LinkAppearance).props.onChange(undefined));expect(tree.root.findByType(ProfileRenderer).props.business.v2.sections.find((s:V2Section)=>s.id==="LINKS").config.linkStyles.link).toEqual({subtitle:"Keep this content"});expect(request).not.toHaveBeenCalled();
});
it("invalid destinations name the affected link while unchanged legacy values remain tolerated",()=>{
  const draft:BuilderSaveDraft={revision:0,profile:{displayName:"Test",bio:"",phone:"",email:"",whatsapp:"",website:"",address:"",googleMapsUrl:"",themeColor:null,logoUrl:null,coverImageUrl:null},design:profileDesign.parse({}),menu:null,sections:[],links:[{id:"l",type:"CUSTOM",label:"Order",value:"broken",isActive:true,presentation:{width:"FULL",iconMode:"DEFAULT",customIconAssetId:null,socialSectionId:null,socialNetwork:null,v2IsVisible:true}}]};expect(builderDraftErrors(draft,[]).join(" ")).toContain("Link “Order” · value: Enter a valid URL");expect(builderDraftErrors(draft,[{id:"l",type:"CUSTOM",url:"broken"}])).toEqual([]);
});
it("non-revision 409 validation errors do not offer destructive reload guidance",async()=>{
  await mount();await click("Header");const field=tree.root.findAllByType("label").find(n=>text(n).startsWith("Profile name"))!.findByType("input");act(()=>field.props.onChange({target:{value:"Unsaved"}}));request.mockResolvedValue({ok:false,status:409,json:async()=>({error:"Choose an image uploaded for this profile."})});await click("Save Changes");expect(text(tree.root.findByProps({role:"alert"}))).not.toContain("retrying will not resolve");expect(tree.root.findAllByType("button").some(n=>text(n).includes("Reload saved profile"))).toBe(false);
});
it("409 retains the draft and requires explicit discard confirmation",async()=>{
  await mount();await click("Header");const field=tree.root.findAllByType("label").find(n=>text(n).startsWith("Profile name"))!.findByType("input");act(()=>field.props.onChange({target:{value:"Unsaved"}}));request.mockResolvedValue({ok:false,status:409,json:async()=>({error:"Changed elsewhere"})});await click("Save Changes");expect(tree.root.findByType(ProfileRenderer).props.business.profile.displayName).toBe("Unsaved");expect(text(tree.root.findByProps({role:"alert"}))).toContain("retrying will not resolve");await click("Reload saved profile");expect(tree.root.findAllByType("button").some(n=>text(n).toLowerCase().includes("keep editing"))).toBe(true);
});
