import React from "react";
import {describe,it,expect,vi,afterEach} from "vitest";
import {act,create,type ReactTestRenderer} from "react-test-renderer";
import {renderToStaticMarkup} from "react-dom/server";
import {applyCustomTheme,applyThemeSections,snapshotCurrentDesign,sectionHasStyleOverride,inheritedSectionConfig,appearanceSignature} from "@/lib/custom-themes";
import {profilePresets} from "@/lib/profile-presets";
import {profileDesign} from "@/lib/profile-design";
import {HeaderDetails,coverTreatments,effectiveCoverShading} from "@/components/admin/profile-builder/HeaderDetails";
import {EssentialText,EssentialSectionAppearance} from "@/components/admin/profile-builder/EssentialAppearance";
import {ProfilePreviewFrame} from "@/components/admin/profile-builder/ProfilePreviewFrame";
import {InputValidationProvider,useInputValidation} from "@/components/ui/InputValidation";
import {ColorPicker} from "@/components/ui/ColorPicker";
import {SocialDetails} from "@/components/admin/profile-builder/SocialDetails";
import {VisualChoice} from "@/components/admin/profile-builder/VisualFields";
import {setup,mount,select,click,region,preview,text,successfulSave,payload} from "./helpers/builder-v3";
import type {V2Section} from "@/lib/profile-v2";
let tree:ReactTestRenderer|undefined;
afterEach(()=>{if(tree){act(()=>tree!.unmount());tree=undefined}vi.unstubAllGlobals()});
const section=():V2Section=>({id:"links",kind:"CORE",singletonKey:"LINKS",internalName:"Keep",visibleTitle:"Public title",isVisible:false,position:3,config:{visual:{action:{minHeight:90}},linkStyles:{link:{action:{minHeight:80},subtitle:"Supporting content"}}},items:[{id:"item",kind:"TEXT",position:0,width:"FULL",isVisible:false,config:{text:"Keep this",visual:{text:{size:40}}},referencedProfileLinkId:null,images:[]}]});
describe("theme correctness",()=>{
 it.each(profilePresets.map(p=>[p.name,p.visual] as const))("applies %s without keeping unrelated section/footer appearance",(name,visual)=>{
  const previous=profileDesign.parse({visual:profilePresets[0].visual,footer:{hidden:true,text:"Keep footer",visual:{decoration:"CURVED_RULES",surface:{color:"#111111"}}}});
  const recipe=snapshotCurrentDesign(profileDesign.parse({visual}),null);
  const applied=applyCustomTheme(previous,recipe),before=section(),next=applyThemeSections([before],recipe)[0];
  expect(next.config.visual).toBeUndefined();expect(next.config.linkStyles).toEqual(before.config.linkStyles);
  expect(next.items).toBe(before.items);expect(next).toMatchObject({id:before.id,isVisible:false,position:3,internalName:"Keep",visibleTitle:"Public title"});
  expect(applied.visual?.canvas).toEqual(recipe.visual.canvas);expect(applied.footer).toMatchObject({text:"Keep footer",hidden:true,visual:{decoration:"NONE"}});
 });
 it("Reset clears item appearance but retains supporting content, references and visibility",()=>{
  const before=section(),recipe=snapshotCurrentDesign(profileDesign.parse({visual:profilePresets[0].visual}),null);
  const reset=applyThemeSections([before],recipe,true)[0];
  expect(reset.config.linkStyles).toEqual({link:{subtitle:"Supporting content"}});
  expect(reset.items[0].config).toEqual({text:"Keep this"});expect(reset.items[0].isVisible).toBe(false);expect(before.items[0].config.visual).toBeDefined();
 });
 it("distinguishes a theme section recipe from a user override and resets only the section",()=>{
  const source={...section(),kind:"SOCIALS",singletonKey:"SOCIALS",config:{visual:{action:{iconSize:26}},composition:"ICONS"}} as V2Section;
  const recipe=snapshotCurrentDesign(profileDesign.parse({visual:profilePresets[0].visual}),null,[source]);
  expect(sectionHasStyleOverride(source,recipe)).toBe(false);
  const changed={...source,config:{...source.config,visual:{action:{iconSize:30}}}};
  expect(sectionHasStyleOverride(changed,recipe)).toBe(true);
  expect(inheritedSectionConfig(changed,recipe).visual).toEqual(source.config.visual);
  expect(appearanceSignature({action:{},text:{size:16,color:"#ffffff"}})).toBe(appearanceSignature({text:{color:"#ffffff",size:16}}));
 });
});
describe("existing cover and value controls",()=>{
 it("Customize reveals controls without freezing global values; one change stores only that property",()=>{
  const change=vi.fn(),source={...section(),kind:"SOCIALS",singletonKey:"SOCIALS",config:{}} as V2Section;
  act(()=>{tree=create(<EssentialSectionAppearance section={source} global={{version:1,socials:{surface:{variant:"GLASS",color:"#111111",radius:48},action:{minHeight:48}}}} onChange={change}/>)});
  const customize=tree!.root.findAllByType("input").find(n=>n.props.type==="checkbox"&&text(n.parent!).includes("Customize this section"))!;
  expect(customize.props.checked).toBe(false);act(()=>customize.props.onChange({target:{checked:true}}));expect(change).not.toHaveBeenCalled();
  const details=tree!.root.findByType(SocialDetails);
  act(()=>details.props.onChange({...details.props.value,action:{...details.props.value.action,minHeight:60}}));
  expect(change.mock.lastCall![0].config.visual).toEqual({action:{minHeight:60}});
  act(()=>tree!.root.findAllByType("button").find(n=>text(n)==="Reset local appearance")!.props.onClick());expect(customize.props.checked).toBe(false);
 });
 it("Original writes explicit zeros and effective missing Overlay shading is 40",()=>{
  const change=vi.fn();act(()=>{tree=create(<HeaderDetails hero={{composition:"IMAGE_HERO"}} onChange={change}/>)});
  expect(effectiveCoverShading({composition:"IMAGE_HERO"})).toBe(40);
  act(()=>tree!.root.findAllByType(VisualChoice).find(n=>n.props.label==="Treatment")!.props.onChange("ORIGINAL"));
  expect(change).toHaveBeenCalledWith({overlayOpacity:0,fade:0,overlayColor:"#000000"});
  expect(effectiveCoverShading({composition:"IMAGE_HERO",overlayOpacity:0})).toBe(0);
  expect(Object.values(coverTreatments).map(v=>v.overlayOpacity)).toEqual([0,12,25,40]);
 });
 it("does not present exact text size 18 as the Medium label preset",()=>{
  const html=renderToStaticMarkup(<EssentialText role="label" value={{size:18}} onChange={()=>{}}/>);
  expect(html).toContain('value="18"');expect(html).toContain("Custom text size");
 });
 it.each([375,390,430])("keeps an explicit %spx content width",(width)=>{
  const html=renderToStaticMarkup(<ProfilePreviewFrame width={width}><p>One renderer</p></ProfilePreviewFrame>);
  expect(html).toContain("width:"+(width+14)+"px");expect(html).toContain('max-width:none');
 });
 it("Social effective size wins over a legacy Medium selection without changing data",()=>{
  const source={...section(),kind:"SOCIALS",singletonKey:"SOCIALS",config:{iconSize:"MEDIUM",visual:{action:{iconSize:26}},composition:"ICONS"}} as V2Section;
  const html=renderToStaticMarkup(<EssentialSectionAppearance section={source} global={profilePresets[0].visual} onChange={()=>{}}/>);
  expect(html).toContain('aria-label="Social icon size"');expect(html).toContain('value="26"');expect(html).not.toContain("Glyph size");
 });
});
describe("shared explicit Save safety",()=>{
 it("invalid HEX cannot be hidden by a local Content tab",async()=>{
  setup();tree=await mount();await select(tree,"Header");await click(tree,"Appearance");
  const picker=tree.root.findAllByType(ColorPicker)[0];
  act(()=>picker.findAllByType("input").find(n=>n.props["aria-label"]===`${picker.props.label} HEX`)!.props.onChange({target:{value:"#badhex"}}));
  await click(tree,"Content");expect(tree.root.findAllByType(ColorPicker).length).toBeGreaterThan(0);
  const stop=vi.fn(),prevent=vi.fn();
  act(()=>tree!.root.find(n=>n.props["data-builder-v3"]!==undefined).props.onClickCapture({target:{closest:(selector:string)=>selector==="[data-color-picker]"?null:{}},preventDefault:prevent,stopPropagation:stop}));
  expect(prevent).toHaveBeenCalled();expect(stop).toHaveBeenCalled();
 });
 it("invalid HEX blocks Save and editor switching, preserves draft, and recovers after correction",async()=>{
  const env=setup();tree=await mount();await select(tree,"Design");
  const field=tree.root.findAllByType(EssentialText).find(n=>n.props.role==="body")!.findByType(ColorPicker);
  const value=field.props.value;
  act(()=>field.findAllByType("input").find(n=>n.props["aria-label"]==="Text color HEX")!.props.onChange({target:{value:"#badhex"}}));
  expect(tree.root.findAllByType("button").find(n=>text(n).includes("Save Changes"))!.props.disabled).toBe(true);
  expect(field.findAllByType("input").find(n=>n.props["aria-invalid"])!.props["aria-describedby"]).toBeTruthy();
  await select(tree,"Header");expect(region(tree,"editor").findAllByType(ColorPicker).some(n=>n.props.label==="Text color")).toBe(true);
  expect(preview(tree).business.v2.design.visual.typography?.body?.color).not.toBe("#badhex");expect(env.request).not.toHaveBeenCalled();
  act(()=>field.findAllByType("input").find(n=>n.props["aria-label"]==="Text color HEX")!.props.onChange({target:{value:"#123456"}}));
  successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).design.visual.typography.body.color).toBe("#123456");expect(value).not.toBe("#badhex");
 });
});

