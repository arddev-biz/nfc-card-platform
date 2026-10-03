import React from "react";
import TestRenderer from "react-test-renderer";
import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import {itemKinds,type V2Item} from "@/lib/profile-v2";
import {Field} from "@/components/admin/profile-builder/V2Controls";
import {VisualChoice} from "@/components/admin/profile-builder/VisualControls";
import {CustomContentDraftEditor} from "@/components/admin/profile-builder/CustomContentDraftEditor";
import {EssentialSectionAppearance} from "@/components/admin/profile-builder/EssentialAppearance";
import {builderDraftSchema} from "@/lib/profile-builder-draft";
import {act,setup,mount,select,selectLink,click,field,preview,region,successfulSave,payload,boundary,SortableList,text} from "./helpers/builder-v3";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));vi.mock("next/image",()=>({default:()=>null}));
let tree:TestRenderer.ReactTestRenderer,env:ReturnType<typeof setup>;
beforeEach(()=>{env=setup()});afterEach(()=>{if(tree)act(()=>tree.unmount());vi.unstubAllGlobals()});
describe("approved Builder regions with real sortable rows and public renderer",()=>{
 it("retains a Link draft across contextual Appearance and Content navigation",async()=>{
  tree=await mount();await selectLink(tree,"first");await field(tree,"Title","Keep this draft");await select(tree,"LINKS");await click(tree,"Appearance");await click(tree,"Content");await selectLink(tree,"Keep this draft");expect(preview(tree).business.v2.links[0].label).toBe("Keep this draft");expect(env.request).not.toHaveBeenCalled();boundary(tree);
 });
 it("section visibility and heading share one draft and one explicit save",async()=>{
  tree=await mount();await select(tree,"Gallery");await field(tree,"Heading on profile","Draft heading");act(()=>region(tree,"structure").findByProps({role:"switch","aria-label":"Show Gallery on profile"}).props.onClick());expect(env.request).not.toHaveBeenCalled();
  expect(preview(tree).business.v2.sections.find((s:{id:string})=>s.id==="custom")).toMatchObject({visibleTitle:"Draft heading",isVisible:false});successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).sections.find((s:{id:string})=>s.id==="custom")).toMatchObject({visibleTitle:"Draft heading",isVisible:false});
 });
 it.each(["LINKS","Socials","Gallery"])("%s content stays central and Appearance requires explicit navigation",async label=>{
  tree=await mount();await select(tree,label);boundary(tree);expect(region(tree,"structure").findAllByType(EssentialSectionAppearance)).toHaveLength(0);expect(region(tree,"editor").findAllByType(EssentialSectionAppearance)).toHaveLength(0);
  await click(tree,"Appearance");expect(region(tree,"editor").findAllByType(EssentialSectionAppearance)).toHaveLength(1);const customize=region(tree,"editor").findAllByType("input").find(n=>n.props.type==="checkbox")!;expect(customize.props.checked).toBe(false);act(()=>customize.props.onChange({target:{checked:true}}));expect(preview(tree).business.v2.sections.find((s:{id:string})=>s.id===(label==="Gallery"?"custom":label==="Socials"?"SOCIALS":"LINKS")).config.visual).toBeUndefined();expect(customize.props.checked).toBe(true);
 });
 it.each(["Header","Contact","Menu"])("keeps %s controls in the central editor",async label=>{tree=await mount();await select(tree,label);boundary(tree);expect(region(tree,"editor").findAllByType("button").length).toBeGreaterThan(0);expect(env.request).not.toHaveBeenCalled();});
 it("link visibility updates preview immediately and persists through the shared save",async()=>{
  tree=await mount();act(()=>region(tree,"editor").findByProps({role:"switch","aria-label":"Show first"}).props.onClick());expect(env.request).not.toHaveBeenCalled();expect(preview(tree).business.v2.links[0].v2IsVisible).toBe(false);successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).links[0].presentation.v2IsVisible).toBe(false);expect(region(tree,"editor").findByProps({role:"switch","aria-label":"Show first"}).props["aria-checked"]).toBe(false);
 });
 it.each([["LINKS","first"],["Socials","social"]])("edits %s centrally and retains the link draft on return",async(destination,id)=>{
  tree=await mount();await select(tree,destination);expect(region(tree,"editor").findByProps({role:"switch","aria-label":"Show "+id}).props["aria-checked"]).toBe(true);await selectLink(tree,id);await field(tree,"Title","Draft");boundary(tree);await select(tree,"Header");await select(tree,destination);await selectLink(tree,"Draft");expect(preview(tree).business.v2.links.find((l:{id:string})=>l.id===id).label).toBe("Draft");expect(env.request).not.toHaveBeenCalled();
 });
 it.each(itemKinds)("keeps existing Custom %s centrally editable/visible without restoring duplicate creation stores",async kind=>{
  tree=await mount();await select(tree,"Gallery");boundary(tree);const editor=region(tree,"editor").findByType(CustomContentDraftEditor);const list=editor.findAllByType(SortableList).find(n=>n.props.items.some((i:{id:string})=>i.id===kind))!;
  const row=list.findAllByType("div").find(n=>n.props.className==="space-y-4 py-2"&&n.findAllByType("strong").some(strong=>text(strong)===(["CONTACT","MAP","REVIEW","SOCIAL","MENU"].includes(kind)?"Existing content":({HEADING:"Heading",TEXT:"Text",LINK:"Button",IMAGE:"Image",CAROUSEL:"Gallery",DIVIDER:"Divider",SPACER:"Spacer",ICON_TEXT:"Icon / text callout"} as Record<string,string>)[kind])))!;
  // Existing specialist items retain compatibility and visibility, but are not offered as new canonical stores.
  const index=list.props.items.findIndex((i:{id:string})=>i.id===kind);const rows=list.findAllByType("div").filter(n=>n.props.className==="space-y-4 py-2");const exact=rows[index];
  expect(exact??row).toBeDefined();const checkbox=(exact??row).findAllByType("input").find(n=>n.props.type==="checkbox")!;act(()=>checkbox.props.onChange({target:{checked:false}}));
  const current=preview(tree).business.v2.sections.find((s:{id:string})=>s.id==="custom").items.find((i:{id:string})=>i.id===kind);expect(current.isVisible).toBe(false);expect(current.config).toEqual(list.props.items.find((i:{id:string})=>i.id===kind).config);expect(env.request).not.toHaveBeenCalled();
  successfulSave(env.request);await click(tree,"Save Changes");expect(builderDraftSchema.safeParse(payload(env.request)).success).toBe(true);expect(payload(env.request).sections.find((s:{id:string})=>s.id==="custom").items.find((i:{id:string})=>i.id===kind).isVisible).toBe(false);boundary(tree);
 });
 it("sends item Heading alignment to the single real public renderer",async()=>{
  tree=await mount();await select(tree,"Gallery");const editor=tree.root.findByType(CustomContentDraftEditor);const list=editor.findAllByType(SortableList)[0];const row=list.findAllByType("div").find(n=>n.props.className==="space-y-4 py-2")!;
  act(()=>row.findAllByType(Field).find(n=>n.props.label==="Heading")!.props.onChange("Centered heading"));const toggle=row.findByProps({role:"switch","aria-label":"Customize this item"});act(()=>toggle.props.onClick());act(()=>row.findAllByType(VisualChoice).find(n=>n.props.label==="Text alignment")!.props.onChange("CENTER"));
  const heading=region(tree,"preview").findAllByType("h3").find(n=>text(n)==="Centered heading")!;expect(heading.parent!.props.style.textAlign).toBe("center");boundary(tree);expect(env.request).not.toHaveBeenCalled();
 });
 it("keeps section switches local until Save Changes and sends canonical IDs",async()=>{
  tree=await mount();const toggle=()=>region(tree,"structure").findByProps({role:"switch","aria-label":"Show LINKS on profile"});act(()=>toggle().props.onClick());expect(toggle().props["aria-checked"]).toBe(false);expect(env.request).not.toHaveBeenCalled();successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).sections.find((s:{id:string})=>s.id==="LINKS").isVisible).toBe(false);expect(toggle().props["aria-checked"]).toBe(false);
 });
});
