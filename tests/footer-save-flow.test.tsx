import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {beforeEach,afterEach,it,expect,vi} from "vitest";
import {NextRequest} from "next/server";
import {ProfileBuilderShell} from "@/components/admin/ProfileBuilderShell";
import {Field,Choice} from "@/components/admin/profile-builder/V2Controls";
import {ToastProvider} from "@/components/ui/Toast";
import {profileDesign} from "@/lib/profile-design";
import type {V2Data} from "@/lib/profile-v2";
const m=vi.hoisted(()=>({admin:vi.fn(),find:vi.fn(),update:vi.fn(),subscription:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("next/image",()=>({default:()=>null}));
vi.mock("@/lib/auth/session",()=>({getAdminApiUser:m.admin}));
vi.mock("@/lib/db",()=>({db:{$transaction:async(callback:(tx:unknown)=>unknown)=>callback({$queryRaw:vi.fn(),businessProfile:{findUnique:m.find,update:m.update},subscription:{findFirst:m.subscription}})}}));
import {POST} from "@/app/api/admin/businesses/[id]/v2/route";
let tree:TestRenderer.ReactTestRenderer;
const initial:V2Data={version:2,revision:0,theme:"CLASSIC",design:profileDesign.parse({}),sections:[],links:[]};
let persisted={id:"p",builderVersion:2,layoutRevision:0,theme:"CLASSIC",designConfig:initial.design,sections:[],links:[]};
const business={name:"Test",businessType:null,branding:{premium:false,platformName:"Platform"},v2:initial,profile:{displayName:"Test",bio:null,phone:null,email:null,whatsapp:null,website:null,address:null,googleMapsUrl:null,logoUrl:null,coverImageUrl:null,backgroundImageUrl:null,themeColor:null,backgroundType:"SOLID" as const,backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT" as const,links:[]}};
beforeEach(()=>{vi.resetAllMocks();persisted={...persisted,layoutRevision:0,designConfig:initial.design};m.admin.mockResolvedValue({role:"SUPER_ADMIN"});m.find.mockImplementation(async()=>persisted);m.subscription.mockResolvedValue({plan:"standard"});m.update.mockImplementation(async({data})=>{if(data.designConfig)persisted.designConfig=data.designConfig;if(data.layoutRevision)persisted.layoutRevision++;return persisted;});vi.stubGlobal("fetch",async(_url:string,options:{body:string})=>POST(new NextRequest("http://localhost/api/admin/businesses/test/v2",{method:"POST",body:options.body}),{params:{id:"test"}}));});
afterEach(()=>{if(tree)act(()=>tree.unmount());vi.unstubAllGlobals();});
function visible(n:TestRenderer.ReactTestInstance):boolean{return !n.props.hidden&&(!n.parent||visible(n.parent));}
function button(label:string){return tree.root.findAllByType("button").find(n=>visible(n)&&n.children.join("")===label)!;}
async function mount(){await act(async()=>{tree=TestRenderer.create(<ToastProvider><ProfileBuilderShell organizationId="test" businessSlug="test" business={business} initialBlocks={[]} menuAvailable={false} isMenuEnabled={false} menu={null} adminPanel={<div/>}/></ToastProvider>);});await act(async()=>tree.root.findByProps({"data-structure-anchor":"FOOTER"}).props.onClick());}
it("preserves spaces typed character by character through Shell → request → authenticated API → Zod → service → Prisma result → public renderer",async()=>{
  await mount();
  const input=()=>tree.root.findAllByType(Field).find(n=>visible(n)&&n.props.label.startsWith("Footer text"))!;
  const sentence="Made with care for local people";
  for(const char of sentence)await act(async()=>input().props.onChange(input().props.value+char));
  expect(input().props.value).toBe(sentence);
  expect(tree.root.findAllByType(Choice).filter(n=>visible(n)&&n.props.label==="Default surface")).toHaveLength(0);
  await act(async()=>{await button("Save Changes").props.onClick();});
  expect(persisted.designConfig?.footer?.text).toBe(sentence);
  expect(tree.root.findByType("footer").children.join("")).toBe(sentence);
  expect(m.subscription).not.toHaveBeenCalled();
});
it("can hide and restore standard-tier branding as Super Admin; cancellation restores preview",async()=>{
  await mount();await act(async()=>tree.root.findByProps({role:"switch","aria-label":"Hide platform branding"}).props.onClick());
  expect(tree.root.findAllByType("footer")).toHaveLength(0);
  await act(async()=>button("Cancel footer changes").props.onClick());expect(tree.root.findByType("footer").children.join("")).toBe("Platform");
  await act(async()=>button("Restore platform default").props.onClick());await act(async()=>button("Save Changes").props.onClick());
  expect(persisted.designConfig?.footer).toEqual({hidden:false,text:""});
});
