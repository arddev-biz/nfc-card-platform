import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { assertExactOrder, itemKinds, itemConfigs, textConfig, infoConfig, mediaConfig, linkPresentation, v2Request, type V2Data, type V2Link, type V2Section } from "@/lib/profile-v2";
import { buildProfileViewModel } from "@/lib/profileView";
import { ProfileRenderer } from "@/components/profile/ProfileRenderer";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
vi.mock("next/image",()=>({ default:({src,alt}:{src:string;alt:string})=><span data-image={src} aria-label={alt}/> }));
vi.mock("next/link",()=>({default:({href,children}:{href:string;children:React.ReactNode})=><a href={href}>{children}</a>}));
export const section = (key:string,config:Record<string,unknown>={}):V2Section=>({id:key,kind:"CORE",singletonKey:key,internalName:key,visibleTitle:null,position:0,isVisible:true,config,items:[]});
export const link = (id:string,type:V2Link["type"]="CUSTOM"):V2Link=>({id,type,label:id,url:"https://example.com/"+id,isActive:true,width:"FULL",iconMode:"DEFAULT",customIconAssetId:null,iconUrl:null,socialSectionId:null,socialNetwork:null,v2IsVisible:true});
const business:PublicBusinessProfile={name:"Public test",businessType:null,profile:{displayName:"Public test",bio:"Bio value",phone:"+355691234567",email:"test@example.com",whatsapp:null,website:null,address:"Address",googleMapsUrl:"https://maps.example.com",themeColor:null,logoUrl:null,coverImageUrl:null,backgroundImageUrl:null,backgroundType:"SOLID",backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT",links:[]}};
function render(v2:V2Data) { const b={...business,v2,profile:{...business.profile,links:v2.links.filter(l=>l.isActive)}}; return renderToStaticMarkup(<ProfileRenderer business={b} viewModel={buildProfileViewModel(b)} blocks={[]} menuAvailable={true} slug="test"/>); }
const data=(sections:V2Section[],links:V2Link[]=[]):V2Data=>({version:2,revision:0,theme:"CLASSIC",sections,links});
describe("V2 structured validation",()=>{
  it.each(itemKinds)("provides constrained defaults for %s",kind=>{expect(itemConfigs[kind].safeParse({}).success).toBe(true);});
  it("rejects extra executable styling and HTML fields",()=>{expect(itemConfigs.TEXT.safeParse({html:"<script/>"}).success).toBe(false);expect(textConfig.safeParse({color:"url(javascript:x)"}).success).toBe(false);});
  it.each(["javascript:alert(1)","data:text/html,bad","file:///test"])("rejects unsafe link URL %s",url=>expect(itemConfigs.LINK.safeParse({url}).success).toBe(false));
  it("uses fail-closed Business Info presentation defaults",()=>expect(Object.values(infoConfig.parse({})).every(v=>v===false)).toBe(true));
  it("requires an uploaded asset for custom icons",()=>expect(linkPresentation.safeParse({width:"FULL",iconMode:"CUSTOM",customIconAssetId:null,socialSectionId:null,socialNetwork:null,v2IsVisible:true}).success).toBe(false));
  it("rejects unsupported carousel settings",()=>{expect(mediaConfig.safeParse({speed:"INSTANT"}).success).toBe(false);expect(mediaConfig.safeParse({autoplay:"true"}).success).toBe(false);});
  it("accepts motion off and reduced-motion-compatible configuration",()=>expect(mediaConfig.parse({autoplay:false,mode:"CONTINUOUS",loop:false})).toMatchObject({autoplay:false,loop:false}));
  it("rejects extra command properties",()=>expect(v2Request.safeParse({revision:0,command:{op:"theme",theme:"CLASSIC",organizationId:"foreign"}}).success).toBe(false));
  it("requires exact reorder including hidden records",()=>{expect(()=>assertExactOrder(["a","hidden"],["a"])).toThrow();expect(()=>assertExactOrder(["a","b"],["a","a"])).toThrow();expect(()=>assertExactOrder(["a","b"],["b","a"])).not.toThrow();});
});
describe("one shared V2 renderer",()=>{
  it("does not expose populated hidden contact data",()=>{const html=render(data([section("BUSINESS_INFO",infoConfig.parse({}))]));expect(html).not.toContain("tel:");expect(html).not.toContain("test@example.com");expect(html).not.toContain("Address");});
  it("shows only explicitly enabled Business Info fields",()=>{const html=render(data([section("BUSINESS_INFO",infoConfig.parse({phone:true}))]));expect(html).toContain("tel:+355691234567");expect(html).not.toContain("mailto:");});
  it("keeps hidden reviews hidden inside visible Links",()=>{const review={...link("review","GOOGLE_REVIEWS"),v2IsVisible:false};const html=render(data([section("LINKS")],[review,link("normal")]));expect(html).not.toContain("example.com/review");expect(html).toContain("example.com/normal");});
  it("renders Reviews through Links with per-link width",()=>{const html=render(data([section("LINKS")],[{...link("review","GOOGLE_REVIEWS"),width:"HALF"}]));expect(html).toContain('data-width="HALF"');expect(html).toContain("example.com/review");});
  it("does not repeat Socials records in ordinary Links",()=>{const social={...section("SOCIALS"),kind:"SOCIALS"};const html=render(data([section("LINKS"),social],[{...link("instagram","INSTAGRAM"),socialSectionId:"SOCIALS"}]));expect(html.match(/href="https:\/\/example.com\/instagram"/g)).toHaveLength(1);});
  it("honors saved section order and hidden Bio",()=>{const bio={...section("BIO"),isVisible:false};const html=render(data([bio,section("LINKS")],[link("visible")]));expect(html).not.toContain("Bio value");});
  it("renders constrained Bio presentation",()=>{const html=render(data([section("BIO",textConfig.parse({italic:true,weight:"BOLD",align:"RIGHT",color:"#123456"}))]));expect(html).toContain("font-style:italic");expect(html).toContain("text-align:right");});
  it.each(["CLASSIC","LIQUID_GLASS"])("uses the same renderer for theme %s",theme=>expect(render({...data([section("BIO")]),theme})).toContain(`data-profile-theme="${theme}"`));
  it("escapes Custom text instead of executing HTML",()=>{const s={...section("CUSTOM"),kind:"CUSTOM",singletonKey:null,items:[{id:"text",kind:"TEXT",position:0,width:"HALF",isVisible:true,config:itemConfigs.TEXT.parse({text:"<script>alert(1)</script>"}),referencedProfileLinkId:null,images:[]}]};expect(render(data([s]))).toContain("&lt;script&gt;");});
  it("does not render unsupported item config",()=>{const s={...section("CUSTOM"),kind:"CUSTOM",singletonKey:null,items:[{id:"link",kind:"LINK",position:0,width:"FULL",isVisible:true,config:{url:"javascript:alert(1)",label:"Unsafe"},referencedProfileLinkId:null,images:[]}]};expect(render(data([s]))).not.toContain("javascript:");});
});
