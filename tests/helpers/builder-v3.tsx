import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {vi,expect} from "vitest";
import {ProfileBuilderShell} from "@/components/admin/ProfileBuilderShell";
import {ProfileRenderer} from "@/components/profile/ProfileRenderer";
import {ToastProvider} from "@/components/ui/Toast";
import {profileDesign} from "@/lib/profile-design";
import {itemConfigs,itemKinds,type V2Data,type V2Section,type V2Link} from "@/lib/profile-v2";
import {SortableList} from "@/components/admin/profile-builder/SortableList";
export {act,SortableList};
export const section=(key:string,position=0):V2Section=>({id:key,kind:key==="SOCIALS"?"SOCIALS":"CORE",singletonKey:key,internalName:key,visibleTitle:null,position,isVisible:true,config:key==="BUSINESS_INFO"?{phone:true}: {},items:[]});
const link=(id:string,socialSectionId:string|null):V2Link=>({id,type:"CUSTOM",label:id,url:"https://example.com/"+id,isActive:true,width:"FULL",iconMode:"DEFAULT",v2IsVisible:true,customIconAssetId:null,iconUrl:null,socialSectionId,socialNetwork:socialSectionId?"INSTAGRAM":null});
export const data:V2Data={version:2,revision:0,theme:"CLASSIC",design:profileDesign.parse({visual:{version:1}}),links:[link("first",null),link("second",null),link("social","SOCIALS")],sections:[...["BIO","BUSINESS_INFO","LINKS","MENU","SOCIALS"].map(section),{...section("custom",5),kind:"CUSTOM",singletonKey:null,internalName:"Gallery",items:itemKinds.map((kind,position)=>({id:kind,kind,position,width:"FULL",isVisible:true,config:itemConfigs[kind].parse({}),referencedProfileLinkId:null,images:[]}))}]};
export const business={name:"Example",businessType:null,v2:data,profile:{displayName:"Example",bio:"Biography",phone:null,email:null,whatsapp:null,website:null,address:null,googleMapsUrl:null,logoUrl:null,coverImageUrl:null,backgroundImageUrl:null,themeColor:null,backgroundType:"SOLID" as const,backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT" as const,links:[]}};
export const text=(node:TestRenderer.ReactTestInstance):string=>node.children.map(c=>typeof c==="string"?c:text(c)).join("");
export function setup(){
 const request=vi.fn(),confirm=vi.fn(()=>true);
 vi.stubGlobal("fetch",(url:string,init?:{method?:string})=>!init?.method?Promise.resolve({ok:true,json:async()=>({themes:[]})}):request(url,init));vi.stubGlobal("window",{confirm,addEventListener:vi.fn(),removeEventListener:vi.fn(),matchMedia:()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()})});
 vi.stubGlobal("document",{addEventListener:vi.fn(),removeEventListener:vi.fn()});
 return {request,confirm};
}
export async function mount(){let tree!:TestRenderer.ReactTestRenderer;await act(async()=>{tree=TestRenderer.create(<ToastProvider><ProfileBuilderShell organizationId="org" businessSlug="example" business={business} initialBlocks={[]} menuAvailable={false} isMenuEnabled={false} menu={null} adminPanel={<p>Administrative policy</p>}/></ToastProvider>)});return tree;}
export const region=(tree:TestRenderer.ReactTestRenderer,name:string)=>tree.root.findByProps({"aria-label":({structure:"Profile structure",editor:"Profile editor",preview:"Live preview"} as Record<string,string>)[name]});
export const preview=(tree:TestRenderer.ReactTestRenderer)=>tree.root.findByType(ProfileRenderer).props;
export async function click(tree:TestRenderer.ReactTestRenderer,label:string,scope=tree.root){const button=scope.findAllByType("button").find(n=>text(n).trim()===label);expect(button,label).toBeDefined();await act(async()=>{await button!.props.onClick()});}
export async function select(tree:TestRenderer.ReactTestRenderer,label:string){const button=region(tree,"structure").findAllByType("button").find(n=>n.props.role!=="switch"&&text(n).startsWith(label));expect(button,label).toBeDefined();await act(async()=>button!.props.onClick());}
export async function selectLink(tree:TestRenderer.ReactTestRenderer,id:string){const button=region(tree,"editor").findAllByType("button").find(n=>n.props.className==="builder-v3-row-main"&&text(n).startsWith(id));expect(button,id).toBeDefined();await act(async()=>button!.props.onClick());}
export async function field(tree:TestRenderer.ReactTestRenderer,label:string,value:string){const node=region(tree,"editor").findAllByType("label").find(n=>text(n).trim()===label);expect(node,label).toBeDefined();const input=node!.findAll(n=>n.type==="input"||n.type==="textarea")[0];await act(async()=>input.props.onChange({target:{value}}));}
export function successfulSave(request:ReturnType<typeof vi.fn>,transform:(v:V2Data)=>V2Data=v=>v){request.mockImplementation(async(_url:string,init:{body:string})=>{const payload=JSON.parse(init.body);const next={...data,theme:payload.design.theme,revision:payload.revision+1,design:payload.design,sections:payload.sections.map((s:V2Section,position:number)=>({...s,position})),links:payload.links.map((l:{id:string;type:V2Link["type"];value:string;label:string;isActive:boolean;presentation:object})=>({...data.links.find(old=>old.id===l.id),id:l.id,type:l.type,url:l.value,label:l.label,isActive:l.isActive,...l.presentation}))} as V2Data;return {ok:true,status:200,json:async()=>({v2:transform(next),menu:payload.menu})};});}
export const payload=(request:ReturnType<typeof vi.fn>)=>JSON.parse(request.mock.lastCall![1].body);
export function boundary(tree:TestRenderer.ReactTestRenderer){for(const type of ["input","textarea","select"] as const)expect(region(tree,"structure").findAllByType(type)).toHaveLength(0);expect(tree.root.findAllByType(ProfileRenderer)).toHaveLength(1);expect(region(tree,"preview").findAllByType(ProfileRenderer)).toHaveLength(1);}
