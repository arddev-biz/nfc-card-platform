import React from "react";
import {afterEach,expect,it,vi} from "vitest";
import TestRenderer,{act} from "react-test-renderer";
import {readFileSync} from "node:fs";
import {backgroundRecipes,applyBackgroundRecipe} from "@/lib/background-recipes";
import {backgroundPresets} from "@/lib/profile-presentation";
import {profileDesign} from "@/lib/profile-design";
import {BackgroundEditor,gradientDirections} from "@/components/admin/profile-builder/BackgroundEditor";
import {ColorPicker} from "@/components/ui/ColorPicker";
import {ThemeThumbnail} from "@/components/admin/profile-builder/ThemeThumbnail";
let tree:TestRenderer.ReactTestRenderer;
afterEach(()=>{if(tree)act(()=>tree.unmount())});
it("offers 20 recipes retaining six advanced treatments and one explicit simple source",()=>{
 const base=profileDesign.parse({backgroundPreset:"MESH",visual:{version:1,canvas:{background:"EXISTING",gap:24},hero:{tagline:"Content stays"}}});
 expect(backgroundRecipes).toHaveLength(20);
 for(const recipe of backgroundRecipes){const applied=profileDesign.parse(applyBackgroundRecipe(base,recipe));expect(applied.visual?.canvas?.gap).toBe(24);expect(applied.visual?.hero?.tagline).toBe("Content stays");if(recipe.named){expect(recipe.preview).toBe(backgroundPresets[recipe.named]);expect(applied.visual?.canvas?.background).toBe("EXISTING")}else{expect(applied.backgroundPreset).toBeUndefined();expect(applied.visual?.canvas?.color).toBe(recipe.canvas?.color)}}
});
it("maps all eight direction controls to the existing angle field",()=>{
 const change=vi.fn();act(()=>{tree=TestRenderer.create(<BackgroundEditor design={profileDesign.parse({visual:{version:1,canvas:{background:"GRADIENT"}}})} onChange={change} organizationId="org" backgroundUrl={null} coverUrl={null} onBackgroundChange={vi.fn()}/>)});
 expect(gradientDirections.map(d=>d.angle).sort((a,b)=>a-b)).toEqual([0,45,90,135,180,225,270,315]);
 const buttons=tree.root.findAllByType("button").filter(b=>b.props["aria-label"]?.startsWith("Gradient direction"));expect(buttons).toHaveLength(8);
 buttons.forEach((b,index)=>{act(()=>b.props.onClick());expect(change.mock.lastCall?.[0].visual.canvas.gradientAngle).toBe(gradientDirections[index].angle)});expect(tree.root.findAllByType(ColorPicker)).toHaveLength(2);
});
it("retains invalid HEX without draft writes and expands shorthand",()=>{
 const change=vi.fn();act(()=>{tree=TestRenderer.create(<ColorPicker label="Color" value="#123456" onChange={change}/>)});const input=()=>tree.root.findAllByType("input").find(i=>i.props["aria-label"]==="Color HEX")!;
 act(()=>input().props.onChange({target:{value:"#oops"}}));expect(input().props["aria-invalid"]).toBe(true);expect(change).not.toHaveBeenCalled();act(()=>input().props.onChange({target:{value:"#abc"}}));act(()=>input().props.onBlur());expect(change).toHaveBeenLastCalledWith("#aabbcc");act(()=>input().props.onChange({target:{value:"#987654"}}));expect(change).toHaveBeenLastCalledWith("#987654");
});
it("uses saved thumbnail angles",()=>{act(()=>{tree=TestRenderer.create(<ThemeThumbnail visual={{version:1,canvas:{background:"GRADIENT",color:"#123456",gradientColor:"#abcdef",gradientAngle:270}}}/>)});expect(tree.root.findAllByType("span")[0].props.style.background).toBe("linear-gradient(270deg,#123456,#abcdef)")});
it("fixes inline hover conflicts while preserving hover gating and reduced motion",()=>{const css=readFileSync("app/globals.css","utf8");expect(css).toContain("box-shadow:var(--hover-shadow)!important");expect(css).toContain("@media(hover:hover)");expect(css).toContain("prefers-reduced-motion:reduce");for(const value of ["NONE","SOFT_LIFT","GLOW","SCALE","BRIGHTEN"])expect(css).toContain(`[data-hover-style="${value}"]`)});
