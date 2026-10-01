import React from "react";
import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import type TestRenderer from "react-test-renderer";
import {EssentialDesignEditor} from "@/components/admin/profile-builder/EssentialDesignEditor";
import {CustomContentDraftEditor} from "@/components/admin/profile-builder/CustomContentDraftEditor";
import {profileDesign} from "@/lib/profile-design";
import {act,setup,mount,select,selectLink,click,field,preview,region,successfulSave,payload} from "./helpers/builder-v3";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));vi.mock("next/image",()=>({default:()=>null}));
let tree:TestRenderer.ReactTestRenderer,env:ReturnType<typeof setup>;
beforeEach(()=>{env=setup()});afterEach(()=>{if(tree)act(()=>tree.unmount());vi.unstubAllGlobals();vi.useRealTimers()});
describe("selection-based approved central editor",()=>{
 it("edits only the selected link and retains the draft across selection",async()=>{
  tree=await mount();await select(tree,"LINKS");await selectLink(tree,"first");await field(tree,"Title","Unsaved first");await select(tree,"LINKS");await selectLink(tree,"second");await select(tree,"LINKS");await selectLink(tree,"Unsaved first");
  const labels=region(tree,"editor").findAllByType("label").filter(n=>n.children.some(c=>typeof c!=="string"&&c.type==="span"&&c.children.includes("Title")));expect(labels).toHaveLength(1);expect(preview(tree).business.v2.links[0].label).toBe("Unsaved first");expect(env.request).not.toHaveBeenCalled();
 });
 it("has one explicit Save Changes and never autosaves or adds feature Save buttons",async()=>{
  vi.useFakeTimers();tree=await mount();await selectLink(tree,"first");await field(tree,"Title","Draft");await act(async()=>{await vi.advanceTimersByTimeAsync(5000)});expect(env.request).not.toHaveBeenCalled();expect(tree.root.findAllByType("button").filter(n=>n.props.className==="builder-v3-save")).toHaveLength(1);expect(region(tree,"editor").findAllByType("button").some(n=>n.children.includes("Save"))).toBe(false);
 });
 it("saves the selected link with the shared draft and displays persisted values",async()=>{
  tree=await mount();await selectLink(tree,"first");await field(tree,"Title","Saved label");successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).links.find((l:{id:string})=>l.id==="first").label).toBe("Saved label");expect(preview(tree).business.v2.links[0].label).toBe("Saved label");expect(env.request).toHaveBeenCalledTimes(1);
 });
 it("keeps custom item edits in the central editor across destination changes",async()=>{
  tree=await mount();await select(tree,"Gallery");const editor=tree.root.findByType(CustomContentDraftEditor);act(()=>editor.props.onChange(editor.props.items.map((i:{id:string;config:object})=>i.id==="TEXT"?{...i,config:{...i.config,text:"Draft item"}}:i)));
  await select(tree,"LINKS");await selectLink(tree,"first");await select(tree,"Gallery");expect(tree.root.findByType(CustomContentDraftEditor).props.items.find((i:{id:string})=>i.id==="TEXT").config.text).toBe("Draft item");expect(region(tree,"structure").findAllByType(CustomContentDraftEditor)).toHaveLength(0);expect(env.request).not.toHaveBeenCalled();
 });
 it("requires confirmation before deleting a custom section and defers persistence",async()=>{
  tree=await mount();await select(tree,"Gallery");env.confirm.mockReturnValue(false);await click(tree,"Delete section");expect(env.confirm).toHaveBeenCalledWith(expect.stringContaining("Save Changes"));expect(preview(tree).business.v2.sections.some((s:{id:string})=>s.id==="custom")).toBe(true);expect(env.request).not.toHaveBeenCalled();
  env.confirm.mockReturnValue(true);await click(tree,"Delete section");expect(preview(tree).business.v2.sections.some((s:{id:string})=>s.id==="custom")).toBe(false);expect(env.request).not.toHaveBeenCalled();successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).sections.some((s:{id:string})=>s.id==="custom")).toBe(false);
 });
 it("previews global design immediately and persists it only through Save Changes",async()=>{
  tree=await mount();await select(tree,"Design");const design=profileDesign.parse({theme:"DIMENSIONAL",radius:"PILL",density:"SPACIOUS"});act(()=>tree.root.findByType(EssentialDesignEditor).props.onChange(design));expect(preview(tree).business.v2.design).toEqual(design);expect(env.request).not.toHaveBeenCalled();successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).design).toEqual(design);expect(preview(tree).business.v2.theme).toBe("DIMENSIONAL");
 });
});
