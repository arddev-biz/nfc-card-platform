import React,{useState} from "react";
import TestRenderer,{act} from "react-test-renderer";
import {renderToStaticMarkup} from "react-dom/server";
import {afterEach,it,expect,vi} from "vitest";
import {SaveCoordinator,SaveDomain} from "@/components/admin/profile-builder/SaveCoordinator";
import {SocialIconSurface} from "@/components/profile/SocialIconSurface";
import {SemanticIcon} from "@/components/profile/SemanticIcon";
import {hoverStyles,profileDesign} from "@/lib/profile-design";
import {readFileSync} from "node:fs";
import {GlobalDesignControls} from "@/components/admin/profile-builder/GlobalDesignControls";
import {BusinessInfoEditor} from "@/components/admin/profile-builder/V2Editor";
import {DisclosureScope} from "@/components/admin/profile-builder/DisclosureScope";
let tree:TestRenderer.ReactTestRenderer;
afterEach(()=>{if(tree)act(()=>tree.unmount());vi.unstubAllGlobals();});
it("only overflow menus close siblings, outside clicks and Escape; ordinary disclosures stay open",()=>{
  class Details {
    open=true; overflow=true; parent:Details|null=null; focus=vi.fn();
    hasAttribute(){return this.overflow;}
    contains(node:unknown):boolean{return node instanceof Details&&node.parent===this;}
    removeAttribute(){this.open=false;}
    querySelector(){return {focus:this.focus};}
  }
  const parent=new Details(),child=new Details(),sibling=new Details();parent.overflow=false;child.parent=parent;
  const nodes=[parent,child,sibling];
  const listeners=new Map<string,(event:{target:unknown})=>void>();
  const scope={querySelectorAll:(selector:string)=>nodes.filter(n=>n.open&&(!selector.includes("data-overflow-menu")||n.overflow)),querySelector:()=>nodes.find(n=>n.open&&n.overflow),contains:(node:unknown)=>nodes.includes(node as Details),addEventListener:(name:string,fn:(event:{target:unknown})=>void)=>listeners.set(name,fn),removeEventListener:vi.fn()};
  vi.stubGlobal("HTMLDetailsElement",Details);
  vi.stubGlobal("document",{addEventListener:(name:string,fn:(event:{target:unknown})=>void)=>listeners.set(name,fn),removeEventListener:vi.fn()});
  act(()=>{tree=TestRenderer.create(<DisclosureScope>Controls</DisclosureScope>,{createNodeMock:()=>scope});});
  listeners.get("toggle")!({target:child});expect(parent.open).toBe(true);expect(child.open).toBe(true);expect(sibling.open).toBe(false);
  tree.root.findByType("div").props.onKeyDownCapture({key:"Escape"});expect(child.open||sibling.open).toBe(false);expect(parent.open).toBe(true);expect(child.focus).toHaveBeenCalled();
  child.open=true;listeners.get("toggle")!({target:parent});expect(child.open).toBe(true);
  listeners.get("pointerdown")!({target:{}});expect(child.open).toBe(false);expect(parent.open).toBe(true);
});
it("global save coordinates only dirty domains and retains failed drafts for retry",async()=>{
  const first=vi.fn().mockResolvedValue(true),second=vi.fn().mockResolvedValue(false);
  function Domain({name,save}:{name:string;save:()=>Promise<boolean>}){const [dirty,setDirty]=useState(false);return <><button onClick={()=>setDirty(true)}>{name}</button><SaveDomain dirty={dirty} onSave={async()=>{const ok=await save();if(ok)setDirty(false);return ok;}}>Child save</SaveDomain></>;}
  await act(async()=>{tree=TestRenderer.create(<SaveCoordinator><Domain name="Profile" save={first}/><Domain name="Design" save={second}/></SaveCoordinator>);});
  const button=(text:string)=>tree.root.findAllByType("button").find(n=>n.children.includes(text))!;
  expect(button("Save Changes").props.disabled).toBe(true);
  await act(async()=>button("Design").props.onClick());await act(async()=>button("Save Changes").props.onClick());
  expect(first).not.toHaveBeenCalled();expect(second).toHaveBeenCalledTimes(1);expect(button("Save Changes").props.disabled).toBe(false);
  expect(tree.root.findByProps({role:"alert"}).children.join("")).toContain("retained");
  second.mockResolvedValue(true);await act(async()=>button("Save Changes").props.onClick());expect(button("Save Changes").props.disabled).toBe(true);
  expect(tree.root.findAllByType("button").filter(n=>n.children.includes("Child save"))).toHaveLength(0);
});
it("social containers remain independent from brand glyph and color",()=>{
  const html=renderToStaticMarkup(<SocialIconSurface config={{containerStyle:"FILLED",shape:"CIRCLE",containerColor:"#ffffff",border:true,borderColor:"#334455"}}><SemanticIcon type="YOUTUBE" iconColor="BRAND"/></SocialIconSurface>);
  expect(html).toContain('data-style="FILLED"');expect(html).toContain('data-shape="CIRCLE"');expect(html).toContain("--social-surface:#ffffff");expect(html).toContain("color:#FF0000");
});
it("all ten hover choices have a shared mapping and reduced-motion override",()=>{
  const css=readFileSync("app/globals.css","utf8");expect(hoverStyles).toHaveLength(10);
  for(const hoverStyle of hoverStyles){expect(profileDesign.parse({hoverStyle}).hoverStyle).toBe(hoverStyle);expect(css).toContain(`[data-hover-style="${hoverStyle}"]`);}
  expect(css).toMatch(/prefers-reduced-motion:reduce[\s\S]*transform:none!important/);
});
it("shows Design and Business Info controls directly, with one compact ten-option hover selector",()=>{
  const onChange=vi.fn();
  act(()=>{tree=TestRenderer.create(<GlobalDesignControls value={undefined} theme="CLASSIC" onChange={onChange}/>);});
  expect(tree.root.findAllByType("details")).toHaveLength(0);
  const hover=tree.root.findAllByType("select").find(n=>n.findAllByType("option").some(o=>o.props.value==="SOFT_LIFT"))!;
  expect(hover.findAllByType("option")).toHaveLength(10);
  act(()=>hover.props.onChange({target:{value:"GLOW"}}));expect(onChange).toHaveBeenCalledWith(expect.objectContaining({hoverStyle:"GLOW"}));
  act(()=>tree.unmount());
  act(()=>{tree=TestRenderer.create(<BusinessInfoEditor business={{name:"Test",businessType:null,profile:{displayName:"Test",bio:null,phone:null,email:null,address:null,googleMapsUrl:null,whatsapp:null,website:null,logoUrl:null,coverImageUrl:null,backgroundImageUrl:null,themeColor:null,backgroundType:"SOLID",backgroundColor:null,backgroundGradient:null,backgroundMode:"LIGHT",links:[]}}} mutate={async()=>true} onPreview={()=>{}}/>);});
  expect(tree.root.findAllByType("input")).toHaveLength(6);
  expect(tree.root.findAllByType("button").filter(n=>n.props["aria-expanded"]!==undefined)).toHaveLength(0);
});
