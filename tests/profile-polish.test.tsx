import React from "react";
import { describe,expect,it,vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { profileDesign, surfaceConfig, resolveProfileDesign } from "@/lib/profile-design";
import { itemConfigs, parseSectionConfig, v2Request, type V2Section, type V2Data } from "@/lib/profile-v2";
import { ProfileRenderer } from "@/components/profile/ProfileRenderer";
import { VerificationBadge } from "@/components/profile/VerificationBadge";
import { buildProfileViewModel } from "@/lib/profileView";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
vi.mock("next/image",()=>({default:({src,alt}:{src:string;alt:string})=><span data-image={src} aria-label={alt}/>}));
const section=(key:string,config:Record<string,unknown>={}):V2Section=>({id:key,kind:key==="SOCIALS"?"SOCIALS":"CORE",singletonKey:key,internalName:key,visibleTitle:null,position:0,isVisible:true,config,items:[]});
const b:PublicBusinessProfile={name:"Test",businessType:null,profile:{displayName:"Test",bio:"Biography",phone:null,email:null,whatsapp:null,website:null,address:null,googleMapsUrl:null,themeColor:null,logoUrl:"https://example.com/logo.png",coverImageUrl:null,backgroundImageUrl:null,backgroundType:"SOLID",backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT",links:[]}};
const v2:V2Data={version:2,revision:0,theme:"CLASSIC",sections:[section("BIO")],links:[]};
function render(data:V2Data|undefined=v2,profile:Partial<typeof b.profile>={},menuAvailable=true,preview=false) {const business={...b,v2:data,profile:{...b.profile,...profile}};return renderToStaticMarkup(<ProfileRenderer business={business} viewModel={buildProfileViewModel(business)} menuAvailable={menuAvailable} blocks={[]} slug="test" preview={preview}/>);}
describe("V2 public presentation without legacy regressions",()=>{
  it("disables custom accent without losing the saved color and removes the nested desktop cap",()=>{
    const off=render({...v2,design:profileDesign.parse({accentEnabled:false})},{themeColor:"#aabbcc"});
    const on=render({...v2,design:profileDesign.parse({accentEnabled:true})},{themeColor:"#aabbcc"});
    expect(off).toContain("--v2-accent:currentColor");expect(on).toContain("--v2-accent:#aabbcc");
    expect(off).not.toContain("max-w-md");
  });
  it("renders surface color, curated background, natural desktop width and interactive action styling",()=>{
    const html=render({...v2,design:profileDesign.parse({surfaceColor:"#abcdef",backgroundPreset:"MIDNIGHT"}),sections:[section("MENU")]});
    expect(html).toContain("--v2-surface:#abcdef");expect(html).toContain("--v2-canvas-width:680px");expect(html).toContain("radial-gradient");
    expect(html).toContain('data-appearance="dark"');expect(html).toContain("v2-action");
    expect(html).not.toContain("scale(");
  });
  it("keeps Card Size independent from Density in the actual renderer",()=>{
    const html=render({...v2,design:profileDesign.parse({cardSize:"LARGE",density:"COMPACT",iconStyle:"FILLED"})});
    expect(html).toContain('data-card-size="LARGE"');expect(html).toContain('data-density="COMPACT"');expect(html).toContain('data-icon-style="FILLED"');
  });
  it("renders saved authorized footer configuration without public entitlement overrides",()=>{
    const business={...b,branding:{premium:false,platformName:"Canonical platform"},v2:{...v2,design:profileDesign.parse({footer:{hidden:true,text:"Custom footer"}})}};
    const renderBusiness=()=>renderToStaticMarkup(<ProfileRenderer business={business} viewModel={buildProfileViewModel(business)} blocks={[]} menuAvailable={false} slug="test"/>);
    expect(renderBusiness()).not.toContain("Canonical platform");expect(renderBusiness()).not.toContain("Custom footer");
    business.branding.premium=true;expect(renderBusiness()).not.toContain("Canonical platform");
  });
  it("shows follower snapshots only when enabled and provider data is available",()=>{
    const data:V2Data={...v2,sections:[section("SOCIALS",{showFollowerCount:true})],links:[{id:"social",type:"INSTAGRAM",label:"Instagram",url:"https://instagram.com/test",width:"FULL",iconMode:"DEFAULT",iconUrl:null,customIconAssetId:null,isActive:true,v2IsVisible:true,socialSectionId:"SOCIALS",socialNetwork:"INSTAGRAM"}]};
    expect(render(data)).not.toContain("followers");
    data.links[0].followers={status:"available",count:1200,provider:"test-fixture",fetchedAt:"2026-09-17T00:00:00Z"};
    expect(render(data)).toContain("1.2K followers");
    data.sections[0].config.showFollowerCount=false;expect(render(data)).not.toContain("1.2K followers");
  });
  it("collapses absent cover space and removes the negative avatar overlap",()=>{const html=render();expect(html).not.toContain("data-profile-cover");expect(html).toContain("pt-8");expect(html).not.toContain("-mt-12");});
  it("retains the cover and overlapping avatar when a cover exists",()=>{const html=render(v2,{coverImageUrl:"https://example.com/cover.png"});expect(html).toContain("data-profile-cover");expect(html).toContain("-mt-12");});
  it("keeps the V1 no-cover placeholder and original layout",()=>{const legacy={...b};const html=renderToStaticMarkup(<ProfileRenderer business={legacy} viewModel={buildProfileViewModel(legacy)} blocks={[]} menuAvailable={false} slug="test"/>);expect(html).toContain("data-profile-cover");expect(html).not.toContain("v2-canvas");expect(html).not.toContain("profile-v2");});
  it("defaults Bio to unboxed typography",()=>{expect(render()).toContain('data-surface="NONE"');expect(render()).toContain("Biography");});
  it("accepts explicit Bio border/background/padding/shadow overrides",()=>{const html=render({...v2,sections:[section("BIO",{surface:{preset:"CARD",border:false,padding:false,shadow:true,background:true}})]});expect(html).toContain('data-surface="CARD"');expect(html).toContain('data-border="false"');expect(html).toContain('data-padding="false"');expect(html).toContain('data-shadow="true"');});
  it("renders canonical socials as clean icons without repeating them in Links",()=>{const html=render({...v2,sections:[section("SOCIALS",{spacing:"SPACIOUS"}),section("LINKS")],links:[{id:"social",type:"INSTAGRAM",label:"Instagram",url:"https://instagram.com/test",width:"HALF",iconMode:"DEFAULT",iconUrl:null,customIconAssetId:null,isActive:true,v2IsVisible:true,socialSectionId:"SOCIALS",socialNetwork:"INSTAGRAM"}]});expect(html.match(/href="https:\/\/instagram.com\/test"/g)).toHaveLength(1);expect(html).toContain("v2-social");expect(html).toContain("gap:24px");});
  it.each(["CLASSIC","LIQUID_GLASS","DIMENSIONAL"] as const)("uses the same renderer and canvas for %s",theme=>{const html=render({...v2,design:profileDesign.parse({theme})});expect(html).toContain(`data-profile-theme="${theme}"`);expect(html).toContain("v2-canvas");});
  it("renders global design tokens and preview framing mode",()=>{const html=render({...v2,design:profileDesign.parse({iconStyle:"FILLED",radius:"PILL",density:"SPACIOUS",surface:"GLASS"})},{},true,true);for(const value of ['data-icon-style="FILLED"','data-radius="PILL"','data-density="SPACIOUS"','data-default-surface="GLASS"','data-preview="true"'])expect(html).toContain(value);});
  it("uses soft-dark even without a saved custom background",()=>{const html=render(v2,{backgroundMode:"DARK"});expect(html).toContain('data-appearance="dark"');expect(html).toContain("background-color:#303644");});
  it("references the canonical menu in Custom and obeys menu availability",()=>{const data={...v2,sections:[{...section("CUSTOM"),singletonKey:null,kind:"CUSTOM",items:[{id:"menu",kind:"MENU",width:"HALF",position:0,isVisible:true,config:itemConfigs.MENU.parse({}),referencedProfileLinkId:null,images:[]}]}]};expect(render(data)).toContain('href="/test/menu"');expect(render(data)).toContain('data-width="HALF"');expect(render(data,{},false)).not.toContain('href="/test/menu"');});
  it("renders verification only when explicitly enabled",()=>{expect(render()).not.toContain("Verified profile");expect(render(v2,{isVerified:true,verificationColor:"#123456"})).toContain("color:#123456");expect(render(v2,{isVerified:true})).toContain('aria-label="Verified profile"');});
  it("uses a dark tick on a light custom badge and a white tick on blue",()=>{expect(renderToStaticMarkup(<VerificationBadge color="#ffffff"/>)).toContain('stroke="#172033"');expect(renderToStaticMarkup(<VerificationBadge/>)).toContain('stroke="#fff"');});
  it("defensively rejects unsafe badge color syntax",()=>expect(renderToStaticMarkup(<VerificationBadge color="url(javascript:bad)"/>)).toContain("color:#2563EB"));
});
describe("constrained presentation validation",()=>{
  it("validates complete design commands with a 3D theme",()=>expect(v2Request.safeParse({revision:0,command:{op:"design",data:{theme:"DIMENSIONAL",radius:"ROUNDED"}}}).success).toBe(true));
  it.each([{radius:"10000px"},{iconStyle:"EXTERNAL_SCRIPT"},{surface:"url(javascript:x)"},{density:-1},{css:"position:fixed"}])("rejects arbitrary design input %j",input=>expect(profileDesign.safeParse(input).success).toBe(false));
  it("retains old theme selection when new design metadata is absent",()=>expect(resolveProfileDesign(null,"LIQUID_GLASS").theme).toBe("LIQUID_GLASS"));
  it("validates surface controls for sections and compatible items",()=>{expect(parseSectionConfig("SOCIALS",{surface:{preset:"NONE"}})).toMatchObject({surface:{preset:"NONE"}});expect(itemConfigs.TEXT.parse({surface:{border:false}})).toMatchObject({surface:{border:false}});expect(surfaceConfig.safeParse({padding:"200px"}).success).toBe(false);});
});
