import React from "react";
import {describe,it,expect} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {create,act} from "react-test-renderer";
import {PresetNumber} from "@/components/admin/profile-builder/PrecisionControls";
import {SocialDetails} from "@/components/admin/profile-builder/SocialDetails";
import {CardDetails} from "@/components/admin/profile-builder/CardDetails";
import {HeaderVisualControls,FooterVisualControls} from "@/components/admin/profile-builder/VisualControls";
import {EssentialDesignEditor,} from "@/components/admin/profile-builder/EssentialDesignEditor";
import {EssentialSectionAppearance} from "@/components/admin/profile-builder/EssentialAppearance";
import {snapshotCurrentDesign,themeSnapshotSchema,applyThemeSections} from "@/lib/custom-themes";
import {referenceGlassDesign,referenceGlassFooter} from "@/lib/reference-glass-theme";
import type {V2Section} from "@/lib/profile-v2";

describe("Builder precision controls",()=>{
 it("shows custom values without rounding or writing on mount",()=>{
  const changes:number[]=[];let tree:ReturnType<typeof create>;
  act(()=>{tree=create(<PresetNumber label="Size" value={70} min={44} max={160} presets={[{value:60,label:"Normal"}]} onChange={v=>changes.push(v)}/>)});
  expect(changes).toEqual([]);expect(tree!.root.findByType("input").props.value).toBe(70);
  act(()=>tree!.root.findByType("input").props.onChange({target:{value:"71"}}));expect(changes).toEqual([71]);
 });
 it("groups cards and typography under current global Design",()=>{
  const html=renderToStaticMarkup(<EssentialDesignEditor design={referenceGlassDesign} onChange={()=>{}} organizationId="test" backgroundUrl={null} coverUrl={null} onBackgroundChange={()=>{}} accent="#ffffff" onAccentChange={()=>{}}/>);
  for(const label of ["Button text","Secondary text / handle","Page width","Side spacing","Section spacing","Card corners","Border thickness","Icon tile background","Inside padding"])expect(html).toContain(label);
  expect(html).not.toContain("Save Changes");
 });
 it("social exact edits write only the changed property",()=>{
  const changes:unknown[]=[];let tree:ReturnType<typeof create>;
  act(()=>{tree=create(<SocialDetails value={{surface:{gradientColor:"#111214",gradientAngle:145},action:{iconSize:26}}} onChange={v=>changes.push(v)}/>)});
  act(()=>tree!.root.findAllByType("input").find(i=>i.props["aria-label"]==="Icon tile size")!.props.onChange({target:{value:"31"}}));
  expect(changes).toEqual([{action:{iconContainerSize:31}}]);
 });
 it("Header cover and Footer spacing controls reuse existing fields",()=>{
  const header=renderToStaticMarkup(<HeaderVisualControls value={referenceGlassDesign} onChange={()=>{}}/>);
  for(const label of ["Cover position","Cover fit","Shading color","Logo shadow"])expect(header).toContain(label);
  const footer=renderToStaticMarkup(<FooterVisualControls value={{...referenceGlassFooter.visual!,decoration:"NONE"}} onChange={()=>{}}/>);
  for(const label of ["Additional space above footer","Additional Footer inside spacing","Footer background style"])expect(footer).toContain(label);
  expect(renderToStaticMarkup(<CardDetails visual={referenceGlassDesign.visual!} onChange={()=>{}}/>)).toContain("Fill direction");
 });
 it("renders contextual Socials and Links editors with exact gaps",()=>{
  const base={id:"example",kind:"SOCIALS",singletonKey:"SOCIALS",isVisible:true,position:0,internalName:"Socials",visibleTitle:null,items:[],config:{composition:"ICONS",containerStyle:"ICON_ONLY",visual:{layout:{gap:12},surface:{gradientColor:"#111214"}}}} as V2Section;
  const html=renderToStaticMarkup(<EssentialSectionAppearance section={base} global={referenceGlassDesign.visual!} onChange={()=>{}}/>);
  for(const label of ["Presentation","Alignment","Social button size","Social icon size","Icon gap"])expect(html).toContain(label); let editor!:ReturnType<typeof create>;act(()=>{editor=create(<EssentialSectionAppearance section={base} global={referenceGlassDesign.visual!} onChange={()=>{}}/>)});act(()=>editor.root.findAllByType("input").find(n=>n.props.type==="checkbox"&&n.parent?.children.includes("Customize this section"))!.props.onChange({target:{checked:true}}));for(const label of ["Second outer button color","Outer border thickness","Reset local appearance"])expect(JSON.stringify(editor.toJSON())).toContain(label);act(()=>editor.unmount());
  const links=renderToStaticMarkup(<EssentialSectionAppearance section={{...base,kind:"CORE",singletonKey:"LINKS"}} global={referenceGlassDesign.visual!} onChange={()=>{}}/>);
  expect(links).toContain("Space between links");expect(links).toContain('value="12"');
 });
});
describe("appearance-only theme snapshots",()=>{
 const section={id:"business-section",kind:"SOCIALS",singletonKey:"SOCIALS",isVisible:false,position:0,internalName:"Private title",visibleTitle:null,items:[],config:{composition:"ICONS",labels:false,surface:{preset:"NONE"},visual:{layout:{before:12,gap:16},action:{iconSize:26}},linkStyles:{privateLink:{action:{iconSize:32}}},showFollowerCount:true}} as V2Section;
 it("includes reusable section appearance without content, visibility or references",()=>{
  const result=snapshotCurrentDesign(referenceGlassDesign,null,[section]);
  expect(result.sectionAppearance?.SOCIALS).toMatchObject({visual:{layout:{before:12,gap:16},action:{iconSize:26}},surface:{preset:"NONE"}});
  expect(JSON.stringify(result)).not.toMatch(/business-section|privateLink|Private title|isVisible|showFollowerCount/);
  expect(themeSnapshotSchema.safeParse({...result,sectionAppearance:{SOCIALS:{url:"https://example.com"}}}).success).toBe(false);
 });
 it("replaces section appearance while preserving content records and intentional item styles",()=>{
  const snapshot=snapshotCurrentDesign(referenceGlassDesign,null,[{singletonKey:"SOCIALS",config:{visual:{layout:{gap:12,before:8}}}}]);
  const applied=applyThemeSections([section],snapshot)[0];
  expect(applied.id).toBe(section.id);expect(applied.isVisible).toBe(false);expect(applied.items).toBe(section.items);
  expect(applied.config.visual).toMatchObject({layout:{gap:12,before:8}});
  expect(applied.config.linkStyles).toEqual(section.config.linkStyles);
  expect(applyThemeSections([section],snapshotCurrentDesign(referenceGlassDesign,null))[0].config.visual).toBeUndefined();
 });
});
