import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,it,expect,vi} from "vitest";
import {ColorPicker} from "@/components/ui/ColorPicker";
import {Switch} from "@/components/ui/Switch";
import {SystemIcon,iconSets} from "@/components/profile/SystemIcon";
import {ProfileLinkIcon} from "@/components/profile/ProfileMedia";
import {VerificationBadge} from "@/components/profile/VerificationBadge";
import {hasPremiumBranding,resolveFooter,brandingCapabilities} from "@/lib/branding";
import {configuredFollowerState,followerLabel} from "@/lib/social-followers";
vi.mock("next/image",()=>({default:({src}:{src:string})=><span data-image={src}/>}));
describe("feedback controls execute real callbacks",()=>{
  it("keeps incomplete HEX local, expands shorthand on blur, accepts visual colors and clears",()=>{
    const onChange=vi.fn();let tree:TestRenderer.ReactTestRenderer;
    act(()=>{tree=TestRenderer.create(<ColorPicker label="Color" value="#123456" onChange={onChange} allowEmpty/>);});
    const hex=()=>tree.root.findByProps({"aria-label":"Color HEX"});
    act(()=>hex().props.onChange({target:{value:"#ab"}}));expect(onChange).not.toHaveBeenCalled();
    act(()=>hex().props.onChange({target:{value:"#abc"}}));expect(onChange).not.toHaveBeenCalled();
    act(()=>hex().props.onBlur());expect(onChange).toHaveBeenLastCalledWith("#aabbcc");
    act(()=>tree.root.findByProps({type:"color"}).props.onChange({target:{value:"#abcdef"}}));expect(onChange).toHaveBeenLastCalledWith("#abcdef");
    act(()=>tree.root.findByProps({"aria-label":"Color #2563EB"}).props.onClick());expect(onChange).toHaveBeenLastCalledWith("#2563EB");
    act(()=>tree.root.findAllByType("button").find(n=>n.children.includes("Default"))!.props.onClick());expect(onChange).toHaveBeenLastCalledWith("");
    act(()=>tree.unmount());
  });
  it("switch reports the inverse boolean with accessible state",()=>{
    const onChange=vi.fn();let tree:TestRenderer.ReactTestRenderer;
    act(()=>{tree=TestRenderer.create(<Switch label="Visible" checked onChange={onChange}/>);});
    const button=tree!.root.findByType("button");expect(button.props.role).toBe("switch");expect(button.props["aria-checked"]).toBe(true);
    act(()=>button.props.onClick());expect(onChange).toHaveBeenCalledWith(false);act(()=>tree.unmount());
  });
});
describe("actual licensed icon mappings",()=>{
  it("renders ten distinct phone SVG geometries",()=>{
    const shapes=Object.keys(iconSets).map(set=>renderToStaticMarkup(<SystemIcon set={set} glyph="PHONE"/>));
    expect(shapes).toHaveLength(10);expect(new Set(shapes).size).toBe(10);
  });
  it.each(["IONIC","REMIX","HERO"])("uses a true filled variant for %s",set=>{
    expect(renderToStaticMarkup(<SystemIcon set={set} style="FILLED" glyph="PHONE"/>)).not.toBe(renderToStaticMarkup(<SystemIcon set={set} style="OUTLINE" glyph="PHONE"/>));
  });
  it("falls back safely for unsupported families",()=>expect(renderToStaticMarkup(<SystemIcon set="unknown" glyph="PHONE"/>)).toBe(renderToStaticMarkup(<SystemIcon glyph="PHONE"/>)));
  it("separates brand and theme coloring without changing the recognizable social glyph",()=>{
    const render=(iconColor:string)=>renderToStaticMarkup(<ProfileLinkIcon type="INSTAGRAM" mode="DEFAULT" url={null} iconColor={iconColor}/>);
    expect(render("BRAND")).toContain("color:#C13584");expect(render("THEME")).toContain("color:var(--v2-accent)");expect(render("MONOCHROME")).not.toContain("#C13584");
    expect(render("BRAND").match(/d="[^"]+"/g)).toEqual(render("MONOCHROME").match(/d="[^"]+"/g));
  });
  it("custom icon overrides system family and hidden icons remain absent",()=>{
    expect(renderToStaticMarkup(<ProfileLinkIcon type="PHONE" mode="CUSTOM" url="https://example.com/icon.png" iconSet="MATERIAL"/>)).toContain('data-image="https://example.com/icon.png"');
    expect(renderToStaticMarkup(<ProfileLinkIcon type="PHONE" mode="NONE" url={null}/>)).toBe("");
  });
});
describe("honest follower snapshots",()=>{
  it.each([undefined,{status:"unsupported" as const},{status:"not-connected" as const}])("does not invent counts for %j",state=>expect(followerLabel(state)).toBeNull());
  it("has no secretly configured provider",()=>expect(configuredFollowerState()).toEqual({status:"unsupported"}));
  it("formats only provider-attributed valid snapshots",()=>{
    const snapshot={status:"available" as const,count:1200,provider:"test-provider",fetchedAt:"2026-09-17T00:00:00Z"};
    expect(followerLabel(snapshot)).toBe("1.2K followers");
    for(const invalid of [{count:-1},{count:NaN},{provider:""},{fetchedAt:"invalid"}])expect(followerLabel({...snapshot,...invalid})).toBeNull();
  });
});
describe("premium branding and safe accessible verification",()=>{
  const now=new Date("2026-09-17T00:00:00Z");
  const subscription={plan:"premium",status:"ACTIVE",startDate:new Date("2026-01-01"),endDate:new Date("2027-01-01")};
  it("requires an active current premium subscription",()=>{
    expect(hasPremiumBranding(subscription,now)).toBe(true);
    for(const change of [{plan:"standard"},{status:"CANCELLED"},{endDate:now},{startDate:new Date("2027-01-01")}])expect(hasPremiumBranding({...subscription,...change},now)).toBe(false);
  });
  it("separates author capabilities from rendering saved approved configuration",()=>{
    expect(brandingCapabilities("SUPER_ADMIN",false).customizeFooter).toBe(true);
    expect(brandingCapabilities("BUSINESS_OWNER",false).customizeFooter).toBe(false);
    expect(brandingCapabilities("BUSINESS_OWNER",true).customizeFooter).toBe(true);
    expect(resolveFooter({hidden:true},"Platform")).toBeNull();
    expect(resolveFooter({text:"Custom"},"Platform")).toBe("Custom");
  });
  it("renders custom tooltip with keyboard focus and falls back for unsafe text",()=>{
    const html=renderToStaticMarkup(<VerificationBadge tooltip="Checked by our team"/>);
    expect(html).toContain('tabindex="0"');expect(html).toContain('role="tooltip"');expect(html).toContain('aria-label="Checked by our team"');
    expect(renderToStaticMarkup(<VerificationBadge tooltip="<script>bad</script>"/>)).toContain("Verified profile");
  });
});
