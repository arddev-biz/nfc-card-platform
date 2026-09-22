import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileMedia, ProfileLinkIcon } from "@/components/profile/ProfileMedia";
vi.mock("next/image",()=>({ default:({onError,alt}:{onError?:()=>void;alt:string})=><span aria-label={alt} onError={onError}/> }));
const images=["one","two"].map((id,position)=>({id,assetId:id,url:"https://images.example/"+id,position,alt:id,caption:null,destinationUrl:null}));
let renderer:TestRenderer.ReactTestRenderer|undefined;
let reduced=false;
let frame:FrameRequestCallback;
const raf=vi.fn(),cancel=vi.fn(),remove=vi.fn(),disconnect=vi.fn();
const node={scrollLeft:0,scrollWidth:1200,clientWidth:300,scrollTo:vi.fn()};
beforeEach(()=>{
  vi.clearAllMocks();reduced=false;node.scrollLeft=0;
  vi.stubGlobal("window",{matchMedia:()=>({matches:reduced,addEventListener:vi.fn(),removeEventListener:remove})});
  vi.stubGlobal("document",{hidden:false});
  vi.stubGlobal("IntersectionObserver",class {observe(){} disconnect(){disconnect();}});
  raf.mockImplementation((callback:FrameRequestCallback)=>{frame=callback;return 1;});
  vi.stubGlobal("requestAnimationFrame",raf);vi.stubGlobal("cancelAnimationFrame",cancel);
});
afterEach(()=>{if(renderer)act(()=>renderer!.unmount());renderer=undefined;vi.unstubAllGlobals();});
async function mount(config:Record<string,unknown>){await act(async()=>{renderer=TestRenderer.create(<ProfileMedia images={images} carousel config={config}/>,{createNodeMock:()=>node});});}
describe("carousel interaction lifecycle",()=>{
  it("supports pointer dragging and suppresses the destination click after a drag",async()=>{
    await mount({autoplay:false,mode:"CONTINUOUS"});
    const track=renderer!.root.findAllByType("div").find(n=>!!n.props.onPointerMove)!;
    const target={...node,style:{scrollSnapType:""},setPointerCapture:vi.fn()};
    await act(async()=>track.props.onPointerDown({button:0,clientX:180,currentTarget:target}));
    await act(async()=>track.props.onPointerMove({pointerId:1,clientX:100,currentTarget:target}));
    expect(target.scrollLeft).toBe(80);expect(target.setPointerCapture).toHaveBeenCalledWith(1);
    await act(async()=>track.props.onPointerUp({currentTarget:target}));
    const event={preventDefault:vi.fn(),stopPropagation:vi.fn()};track.props.onClickCapture(event);
    expect(event.preventDefault).toHaveBeenCalled();expect(target.style.scrollSnapType).toBe("");
  });
  it("never schedules automatic motion with reduced-motion enabled",async()=>{
    reduced=true;await mount({autoplay:true,mode:"CONTINUOUS"});expect(raf).not.toHaveBeenCalled();
    expect(renderer!.root.findAllByType("button").length).toBeGreaterThanOrEqual(2);
  });
  it("does not schedule autoplay when disabled",async()=>{await mount({autoplay:false});expect(raf).not.toHaveBeenCalled();});
  it("accumulates fractional continuous movement rather than stalling at low speed",async()=>{
    await mount({autoplay:true,mode:"CONTINUOUS",speed:"SLOW"});
    act(()=>{frame(0);frame(100);frame(200);frame(300);});
    expect(node.scrollLeft).toBeGreaterThan(0);
  });
  it("pauses on pointer interaction and cancels animation work",async()=>{
    await mount({autoplay:true,mode:"CONTINUOUS",resume:false});
    await act(async()=>renderer!.root.findByProps({role:"region"}).props.onPointerEnter());
    expect(cancel).toHaveBeenCalled();expect(disconnect).toHaveBeenCalled();
  });
  it("keeps manual next/previous controls with loop off",async()=>{
    await mount({autoplay:false,loop:false});
    await act(async()=>renderer!.root.findByProps({"aria-label":"Next image"}).props.onClick());
    expect(node.scrollTo).toHaveBeenCalledWith({left:300,behavior:"smooth"});
  });
  it("cleans up observers/media listeners on unmount",async()=>{
    await mount({autoplay:true});act(()=>renderer!.unmount());renderer=undefined;
    expect(disconnect).toHaveBeenCalled();expect(remove).toHaveBeenCalled();
  });
});
describe("link icon modes",()=>{
  it("renders no icon in NONE mode",()=>{act(()=>{renderer=TestRenderer.create(<ProfileLinkIcon type="CUSTOM" mode="NONE" url={null}/>);});expect(renderer!.toJSON()).toBeNull();});
  it("falls back to a type icon when a custom image fails",async()=>{
    await act(async()=>{renderer=TestRenderer.create(<ProfileLinkIcon type="INSTAGRAM" mode="CUSTOM" url="https://images.example/icon"/>);});
    await act(async()=>renderer!.root.findByType("span").props.onError());
    expect(renderer!.root.findAllByType("svg")).toHaveLength(1);
  });
});
