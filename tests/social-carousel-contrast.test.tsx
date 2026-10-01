import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {renderToStaticMarkup} from "react-dom/server";
import {afterEach,expect,it,vi} from "vitest";
import {isLightSocialFill} from "@/lib/profile-icons";
import {SocialIconSurface} from "@/components/profile/SocialIconSurface";
import {SemanticIcon} from "@/components/profile/SemanticIcon";
import {SocialIconRow} from "@/components/profile/SocialIconRow";
afterEach(()=>vi.unstubAllGlobals());
it("recognizes light HEX and browser colors without affecting branded fills",()=>{
 for(const color of ["#FFFFFF","#F7F7F8","rgb(255, 255, 255)","color(srgb 1 1 1)"])expect(isLightSocialFill(color)).toBe(true);
 for(const color of ["#000000","#1877F2","rgb(0, 0, 0)","transparent"])expect(isLightSocialFill(color)).toBe(false);
 for(const network of ["TIKTOK","X","SNAPCHAT"]){
  const html=renderToStaticMarkup(<SocialIconSurface config={{containerStyle:"FILLED",containerColor:"#FFFFFF"}} network={network}><SemanticIcon type="CUSTOM" network={network}/></SocialIconSurface>);
  expect(html).toContain('data-light-fill="true"');
  if(network!=="SNAPCHAT")expect(html).toContain("--social-brand-ink:#000000");
 }
 expect(renderToStaticMarkup(<SocialIconSurface config={{containerStyle:"BRANDED"}} network="FACEBOOK">logo</SocialIconSurface>)).not.toContain("data-light-fill");
});
function mount(count=5,reduced=false,clientWidth=200){
 let now=0,next=0;const frames=new Map<number,FrameRequestCallback>();
 vi.stubGlobal("performance",{now:()=>now});
 vi.stubGlobal("window",{matchMedia:()=>({matches:reduced})});vi.stubGlobal("document",{hidden:false});
 vi.stubGlobal("ResizeObserver",class {observe(){}disconnect(){}});
 vi.stubGlobal("IntersectionObserver",class {observe(){}disconnect(){}});
 vi.stubGlobal("requestAnimationFrame",(callback:FrameRequestCallback)=>{frames.set(++next,callback);return next});
 vi.stubGlobal("cancelAnimationFrame",(id:number)=>frames.delete(id));
 const node={children:Array.from({length:count},()=>({getBoundingClientRect:()=>({width:44})})),clientWidth,scrollWidth:count*44+(count-1)*8,scrollLeft:0,dataset:{},setPointerCapture:vi.fn(),scrollBy:vi.fn(),contains:()=>false};
 let tree!:TestRenderer.ReactTestRenderer;
 act(()=>{tree=TestRenderer.create(<SocialIconRow gap={8} align="CENTER">{Array.from({length:count},(_,i)=><div key={i}><a href={"https://example.com/"+i}>link</a></div>)}</SocialIconRow>,{createNodeMock:()=>node})});
 const row=tree.root.find(n=>n.props.className==="social-icon-row");
 const frame=(time:number)=>{now=time;const queued=[...frames.values()];frames.clear();act(()=>queued.forEach(callback=>callback(time)))};
 return{tree,row,node,frame};
}
it("keeps one accessible copy per link and caps more than four to a scrollable row",()=>{
 const {tree,row}=mount();expect(tree.root.findAllByType("a")).toHaveLength(5);expect(row.props.role).toBe("region");expect(row.props.style.maxWidth).toBe(200);expect(row.props.style.touchAction).toBe("pan-y");act(()=>tree.unmount());
 const small=mount(3);expect(small.row.props.role).toBeUndefined();act(()=>small.tree.unmount());
 const narrow=mount(3,false,100);expect(narrow.row.props.role).toBe("region");act(()=>narrow.tree.unmount());
});
it("pauses automatic movement during hover and touch, then resumes after idle",()=>{
 const {tree,row,node,frame}=mount();frame(1000);frame(1064);expect(node.scrollLeft).toBeGreaterThan(0);
 row.props.onPointerEnter({pointerType:"mouse"});const before=node.scrollLeft;frame(1128);expect(node.scrollLeft).toBe(before);
 row.props.onPointerLeave();frame(2000);expect(node.scrollLeft).toBe(before);frame(5000);expect(node.scrollLeft).toBeGreaterThan(before);
 act(()=>tree.unmount());
});
it("touch drag changes scroll position and prevents accidental link activation, while taps remain usable",()=>{
 const {tree,row,node}=mount();const preventDefault=vi.fn(),stopPropagation=vi.fn();
 row.props.onPointerDown({button:0,clientX:100,clientY:10,currentTarget:node});
 row.props.onPointerMove({clientX:50,clientY:11,pointerId:1,currentTarget:node,preventDefault});
 expect(node.scrollLeft).toBe(50);expect(node.setPointerCapture).toHaveBeenCalledWith(1);
 row.props.onPointerUp();row.props.onClickCapture({preventDefault,stopPropagation});expect(stopPropagation).toHaveBeenCalled();
 act(()=>tree.unmount());
 const tap=mount();const prevented=vi.fn();
 tap.row.props.onPointerDown({button:0,clientX:100,clientY:10,currentTarget:tap.node});tap.row.props.onPointerUp();
 tap.row.props.onClickCapture({preventDefault:prevented,stopPropagation:vi.fn()});expect(prevented).not.toHaveBeenCalled();act(()=>tap.tree.unmount());
});
it("respects reduced motion and supports keyboard scrolling",()=>{
 const {tree,row,node,frame}=mount(5,true);frame(1000);frame(1064);expect(node.scrollLeft).toBe(0);
 row.props.onKeyDown({key:"ArrowRight",target:node,currentTarget:node,preventDefault:vi.fn()});
 expect(node.scrollBy).toHaveBeenCalledWith({left:64,behavior:"auto"});act(()=>tree.unmount());
});
