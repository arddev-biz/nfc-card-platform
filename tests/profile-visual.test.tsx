import React from "react";
import {it,expect,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {profileVisual,visualOverride,inheritVisual,surfaceCSS,textCSS,heroDesign,badgeDesign,canvasDesign,visualText,visualSurface,visualAction,visualLayout,mediaVisual,linkStyle} from "@/lib/profile-visual";
import {profilePresets,applyProfilePreset} from "@/lib/profile-presets";
import {profileDesign,resolveProfileDesign} from "@/lib/profile-design";
import {parseSectionConfig,itemConfigs,type V2Section,type V2Item,type V2Link} from "@/lib/profile-v2";
import {ProfileRenderer} from "@/components/profile/ProfileRenderer";
import {buildProfileViewModel} from "@/lib/profileView";
import type {PublicBusinessProfile} from "@/lib/services/public-profile";
import {ProfileVisualControls,HeaderVisualControls,ElementVisualControls} from "@/components/admin/profile-builder/VisualControls";
import {contactCard} from "@/lib/profile-contact";
import {roleTextCSS} from "@/lib/profile-visual";
import {VisualAction} from "@/components/profile/VisualAction";

it("role defaults resolve without mutating explicit typography",()=>{
  const typography={heading:{size:27,color:"#123456",weight:"800" as const}};const before=JSON.stringify(typography);
  expect(roleTextCSS(typography,"heading")).toMatchObject({fontSize:27,color:"#123456",fontWeight:"800",lineHeight:1.35});
  expect(roleTextCSS({},"caption").fontSize).toBe(13);expect(roleTextCSS({},"body").fontSize).toBe(16);expect(JSON.stringify(typography)).toBe(before);
});
it("action icon geometry and label typography respect explicit settings",()=>{
  const html=renderToStaticMarkup(<VisualAction href="/" label="Action" icon={<span>Icon</span>} visual={{action:{iconSize:32,iconContainerSize:48,minHeight:72,padding:22},text:{size:19,weight:"800"},surface:{radius:8}}}/>);
  expect(html).toContain("width:48px;min-width:48px;height:48px");expect(html).toContain("font-size:19px");expect(html).toContain("font-weight:800");expect(html).toContain("min-height:72px");expect(html).toContain("padding:22px");
});
it.each(profilePresets)("$name preserves identical public/preview styling for mixed content",preset=>{
  const design=applyProfilePreset(profileDesign.parse({}),preset.visual);
  const custom:V2Item[]=[{id:"text",kind:"HEADING",position:0,width:"FULL",isVisible:true,config:{text:"A heading",visual:{text:{color:"#2563eb",size:23}}},referencedProfileLinkId:null,images:[]},{id:"button",kind:"LINK",position:1,width:"FULL",isVisible:true,config:{label:"Custom action",url:"https://example.test",visual:{surface:{radius:8}}},referencedProfileLinkId:null,images:[]}];
  const sections=[section("LINKS",{visual:{action:{padding:20}}}),section("BUSINESS_INFO",{phone:true,email:true}),section("MENU")];
  const publicHtml=render(design,sections,custom),previewHtml=render(design,sections,custom,true);
  expect(publicHtml.replace('data-preview="false"','data-preview="true"')).toBe(previewHtml);expect(publicHtml).toContain("visual-contact");expect(publicHtml).toContain("font-size:23px");expect(publicHtml).toContain("padding:20px");
});
import {mkdtempSync,readFileSync,readdirSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import TestRenderer,{act} from "react-test-renderer";
import {ProfilePreviewFrame} from "@/components/admin/profile-builder/ProfilePreviewFrame";
vi.mock("next/image",()=>({default:({src,alt}:{src:string;alt:string})=><span data-image={src} aria-label={alt}/>}));
const business:PublicBusinessProfile={name:"Fixture",businessType:"Studio",profile:{displayName:"Fixture",bio:"Saved bio",phone:"+355691234567",email:"private@example.test",address:"Private address",whatsapp:null,website:null,googleMapsUrl:null,logoUrl:"https://example.test/avatar.png",coverImageUrl:"https://example.test/cover.png",backgroundImageUrl:null,themeColor:null,backgroundType:"SOLID",backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT",links:[]}};
const link:V2Link={id:"one",type:"CUSTOM",label:"Website",url:"https://example.test",isActive:true,width:"FULL",iconMode:"DEFAULT",v2IsVisible:true,customIconAssetId:null,iconUrl:null,socialSectionId:null,socialNetwork:null};
const section=(key:string,config:Record<string,unknown>={}):V2Section=>({id:key,kind:"CORE",singletonKey:key,internalName:key,visibleTitle:key,position:0,isVisible:true,config,items:[]});
function render(design=profileDesign.parse({}),sections=[section("LINKS")],items:V2Item[]=[],preview=false){
  const b:PublicBusinessProfile={...business,v2:{version:2,revision:0,theme:"CLASSIC",design,sections:[...sections,...(items.length?[{...section("custom"),kind:"CUSTOM",singletonKey:null,items}]:[])],links:[link]}};
  return renderToStaticMarkup(<ProfileRenderer business={b} viewModel={buildProfileViewModel(b)} menuAvailable={true} blocks={[]} slug="fixture" preview={preview}/>);
}
it.each(profilePresets)("$name is validated editable data, not a renderer branch",p=>{
  expect(profileVisual.parse(p.visual)).toEqual(p.visual);
  const current=profileDesign.parse({footer:{text:"Keep branding"},hoverStyle:"GLOW"});
  const draft=applyProfilePreset(current,p.visual);
  expect(draft.footer).toEqual(current.footer);expect(draft.hoverStyle).toBe("GLOW");
  const html=render(draft);
  expect(html).toContain('data-visual-version="1"');expect(html).not.toContain(p.name);
  expect(html).toContain('href="https://example.test"');
  draft.visual!.canvas!.maxWidth=600;expect(p.visual.canvas?.maxWidth).not.toBe(600);
});
it("separates profile appearance from header ownership without exposing schema groups",()=>{
  const value=profileDesign.parse({});
  const profile=renderToStaticMarkup(<ProfileVisualControls value={value} onChange={()=>{}}/>);
  const header=renderToStaticMarkup(<HeaderVisualControls value={value} onChange={()=>{}}/>);
  expect(profile).toContain("Choose a theme");expect(profile).not.toContain("Header layout");
  expect(header).toContain("Header layout");expect(header).not.toContain("Verification badge");
  for(const label of ["Canvas","Schema","Surface","Hero","Config"])expect(profile+header).not.toContain(`>${label}<`);
});
it.each([
  {version:2},{version:1,canvas:{maxWidth:5000}},{version:1,hero:{avatarSize:900}},
  {version:1,surface:{blur:200}},{version:1,typography:{body:{size:2}}},
  {version:1,surface:{color:"url(javascript:alert(1))"}},{version:1,hero:{position:"absolute"}},
  {version:1,canvas:{className:"hidden"}},{version:1,typography:{name:{font:"url(remote)"}}},
])("rejects invalid or unbounded design %j",value=>expect(profileVisual.safeParse(value).success).toBe(false));
it("inherits primitives field-by-field and resets without erasing sibling values",()=>{
  const p={surface:{color:"#123456",radius:24},action:{iconSize:32}};
  expect(inheritVisual(p,{surface:{radius:8}})).toMatchObject({surface:{color:"#123456",radius:8},action:{iconSize:32}});
  expect(inheritVisual(p,{surface:{}}).surface?.radius).toBe(24);
  expect({...textCSS({color:"#123456"}),...textCSS({size:20})}).toEqual({color:"#123456",fontSize:20});
});
it("preserves legacy defaults and normalizes unsupported visual versions without deleting saved style",()=>{
  expect(resolveProfileDesign({theme:"DIMENSIONAL",radius:"PILL",visual:{version:999}})).toMatchObject({theme:"DIMENSIONAL",radius:"PILL"});
  expect(render()).not.toContain('data-visual-version');
  expect(profileDesign.parse({}).visual).toBeUndefined();
});
it("persists section/link overrides through validation and emits real layout/surface/subtitle styling",()=>{
  const config=parseSectionConfig("LINKS",{visual:{layout:{mode:"GRID",columns:3,mobileColumns:2,gap:18}},linkStyles:{one:{subtitle:"A useful description",surface:{variant:"OUTLINE",radius:8},action:{iconPosition:"TOP"}}}});
  const html=render(profileDesign.parse({visual:profilePresets[0].visual}),[section("LINKS",config)]);
  expect(html).toContain('data-layout="GRID"');expect(html).toContain("--visual-mobile-columns:2");
  expect(html).toContain("A useful description");expect(html).toContain("border-radius:8px");expect(html).toContain("flex-direction:column");
});
it("shares public and preview rendering, preserving hidden sections and ordering",()=>{
  const sections=[{...section("BIO"),isVisible:false},section("LINKS")];
  const design=profileDesign.parse({visual:profilePresets[0].visual});
  const pub=render(design,sections),preview=render(design,sections,[],true);
  expect(pub.replace('data-preview="false"','data-preview="true"')).toBe(preview);
  expect(pub).not.toContain("Saved bio");
});
it.each(["CIRCLE","SEAL","CHECK","SHIELD"])("renders %s badge and flexible portrait header from configuration",variant=>{
  const b={...business,profile:{...business.profile,isVerified:true},v2:{version:2,revision:0,theme:"CLASSIC",design:profileDesign.parse({visual:{version:1,hero:{composition:"PORTRAIT",avatarSize:140,avatarRadius:18},badge:{variant,size:28}}}),sections:[],links:[]}};
  const html=renderToStaticMarkup(<ProfileRenderer business={b} viewModel={buildProfileViewModel(b)} blocks={[]} menuAvailable={false} slug="test"/>);
  expect(html).toContain('data-composition="PORTRAIT"');expect(html).toContain("border-radius:18px");expect(html).toContain("Verified profile");expect(html).toContain("width:28px");
});
it("renders glass with real blur and opacity without making text translucent",()=>{
  expect(surfaceCSS({variant:"GLASS",color:"#123456",opacity:24,blur:16})).toMatchObject({backdropFilter:"blur(16px)",background:"color-mix(in srgb, #123456 24%, transparent)"});
  expect(surfaceCSS({variant:"GLASS"})).not.toHaveProperty("opacity");
});
it("preserves saved primary treatments and item overrides without requiring a named theme",()=>{
  const visual:import("@/lib/profile-visual").ProfileVisual={version:1,primaryAction:{surface:{variant:"SOLID",color:"#c9ff35"}}};
  expect(render(profileDesign.parse({visual}))).toContain("#c9ff35");
  const html=render(profileDesign.parse({visual}),[section("LINKS",{linkStyles:{one:{surface:{color:"#123456"}}}})]);
  expect(html).toContain("color-mix(in srgb, #123456");
});
it("uses uploaded cover photography as a full-page background when selected",()=>{
  const visual:import("@/lib/profile-visual").ProfileVisual={version:1,canvas:{background:"IMAGE",imageSource:"COVER"},hero:{composition:"CENTERED"}};
  const html=render(profileDesign.parse({visual}));
  expect(html).toContain("background-image:url(&quot;https://example.test/cover.png&quot;)");
  expect(html).not.toContain("data-profile-cover");
});
it("renders a testimonial, gallery, and safe contact action without new item kinds",()=>{
  const item=(kind:string,config:Record<string,unknown>,id=kind):V2Item=>({id,kind,config,position:0,width:"FULL",isVisible:true,referencedProfileLinkId:null,images:[]});
  const images=[{id:"photo",assetId:"asset",url:"https://example.test/photo.png",position:0,alt:"Work sample",caption:null,destinationUrl:null}];
  const items=[item("TEXT",itemConfigs.TEXT.parse({text:"Great service",testimonial:{author:"Test Author",rating:5}})),{...item("CAROUSEL",itemConfigs.CAROUSEL.parse({media:{layout:"GRID",columns:3,mobileColumns:2}})),images},item("CONTACT",itemConfigs.CONTACT.parse({action:"SAVE_CONTACT"}))];
  const html=render(profileDesign.parse({}),[],items);
  expect(html).toContain("Great service");expect(html).toContain("Test Author");expect(html).toContain('data-media-layout="GRID"');
  expect(html).toContain('download="contact.vcf"');
  const exported=decodeURIComponent(html.match(/href="(data:text\/vcard[^"]+)"/)![1]);
  expect(exported).not.toContain("private@example.test");expect(exported).not.toContain("Private address");
});
it("escapes vCard delimiters and cannot inject additional contact fields",()=>{
  const card=decodeURIComponent(contactCard("Name\nEMAIL:secret",{address:"A;B"}));
  expect(card).toContain("FN:Name\\nEMAIL:secret");expect(card).toContain("A\\;B");
});
it("link overrides reject unknown executable style properties",()=>{
  expect(()=>parseSectionConfig("LINKS",{linkStyles:{one:{css:"display:none"}}})).toThrow();
  expect(visualOverride.safeParse({surface:{className:"hidden"}}).success).toBe(false);
});
it("uses one mobile-first preview renderer without competing device canvases",()=>{
  let tree:TestRenderer.ReactTestRenderer;
  const b={...business,v2:{version:2,revision:0,theme:"CLASSIC",sections:[],links:[]}};
  act(()=>{tree=TestRenderer.create(<ProfilePreviewFrame><ProfileRenderer business={b} viewModel={buildProfileViewModel(b)} blocks={[]} menuAvailable={false} slug="fixture" preview/></ProfilePreviewFrame>);});
  const original=tree!.root.findByType(ProfileRenderer);
  expect(tree!.root.findAllByType("button").filter(n=>["Tablet","Desktop","Mobile"].some(label=>n.children.includes(label)))).toHaveLength(0);
  expect(tree!.root.findAllByType(ProfileRenderer)).toHaveLength(1);expect(tree!.root.findByType(ProfileRenderer)).toBe(original);
  act(()=>tree.unmount());
});
it("resetting the last element override returns to inherited/legacy presentation",()=>{
  const onChange=vi.fn();let tree:TestRenderer.ReactTestRenderer;
  act(()=>{tree=TestRenderer.create(<ElementVisualControls config={{label:"Keep content",visual:{surface:{radius:24}}}} onChange={onChange}/>);});
  act(()=>tree.root.findByProps({role:"switch","aria-label":"Customize this section"}).props.onClick());
  expect(onChange).toHaveBeenLastCalledWith({label:"Keep content"});
  act(()=>tree.unmount());
});

// Optional server-free visual QA export. Synthetic fixture data only; never queries a database.
if(process.env.PROFILE_VISUAL_EXPORT==="1")it("exports actual renderer markup with production CSS for browser inspection",()=>{
  const dir=mkdtempSync(join(tmpdir(),"auralink-visual-"));
  const css=readdirSync(".next/static/css").filter(f=>f.endsWith(".css")).map(f=>readFileSync(join(".next/static/css",f),"utf8")).join("\n");
  for(const preset of profilePresets){
    const design=profileDesign.parse({visual:preset.visual});
    const sections=[section("BIO"),section("LINKS",{linkStyles:{one:{subtitle:"Discover our work and services"}}})];
    const html=render(design,sections);
    writeFileSync(join(dir,preset.name.replaceAll(" ","-")+".html"),`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${preset.name} renderer fixture</title><style>${css}</style></head><body>${html}</body></html>`);
  }
  console.info(`VISUAL_EXPORT=${dir}`);
});
