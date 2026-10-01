import React from "react";
import {beforeEach,afterEach,describe,expect,it,vi} from "vitest";
import type TestRenderer from "react-test-renderer";
import {EssentialSectionAppearance} from "@/components/admin/profile-builder/EssentialAppearance";
import {act,setup,mount,select,click,field,preview,region,successfulSave,payload,data,boundary,SortableList} from "./helpers/builder-v3";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock("next/image",()=>({default:()=>null}));
let tree:TestRenderer.ReactTestRenderer,env:ReturnType<typeof setup>;
beforeEach(()=>{env=setup()});afterEach(()=>{if(tree)act(()=>tree.unmount());vi.unstubAllGlobals();vi.useRealTimers()});
describe("mounted approved BuilderV3 shared draft/save path",()=>{
 it("retains the canonical Short bio draft across section selection without duplicate editors",async()=>{
  tree=await mount();await select(tree,"Header");await field(tree,"Short bio","Draft Bio");await select(tree,"Gallery");await select(tree,"Header");
  expect(preview(tree).business.profile.bio).toBe("Draft Bio");expect(region(tree,"editor").findAllByType("textarea")).toHaveLength(1);boundary(tree);expect(env.request).not.toHaveBeenCalled();
 });
 it("clears Short bio through explicit Save Changes, not a timer",async()=>{
  vi.useFakeTimers();tree=await mount();await select(tree,"Header");await field(tree,"Short bio","");await act(async()=>{await vi.advanceTimersByTimeAsync(2000)});expect(env.request).not.toHaveBeenCalled();
  successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).profile.bio).toBe("");expect(payload(env.request).sections.find((s:{id:string})=>s.id==="BIO").isVisible).toBe(false);expect(preview(tree).business.profile.bio).toBe("");
 });
 it("reorders canonical section IDs locally and reconciles the saved revision",async()=>{
  tree=await mount();const list=region(tree,"structure").findByType(SortableList);const ordered=[...list.props.items].reverse();act(()=>list.props.onOrder(ordered));expect(env.request).not.toHaveBeenCalled();
  successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).revision).toBe(0);expect(payload(env.request).sections.filter((s:{id:string})=>s.id!=="BIO").map((s:{id:string})=>s.id)).toEqual(ordered.map((s:{id:string})=>s.id));expect(preview(tree).business.v2.revision).toBe(1);expect(env.request.mock.lastCall![0]).toBe("/api/admin/businesses/org/builder-save");
 });
 it("reports rejected saves while retaining the draft and allowing retry",async()=>{
  tree=await mount();await select(tree,"Header");await field(tree,"Profile name","Unsaved");env.request.mockResolvedValue({ok:false,status:400,json:async()=>({error:"Rejected save"})});await click(tree,"Save Changes");
  expect(preview(tree).business.profile.displayName).toBe("Unsaved");expect(tree.root.findByProps({role:"alert"})).toBeDefined();expect(JSON.stringify(tree.toJSON())).toContain("Rejected save");successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).revision).toBe(0);expect(preview(tree).business.v2.revision).toBe(1);
 });
 it("reconciles server-returned visibility instead of assuming the local toggle won",async()=>{
  tree=await mount();act(()=>region(tree,"structure").findByProps({role:"switch","aria-label":"Show LINKS on profile"}).props.onClick());expect(env.request).not.toHaveBeenCalled();
  successfulSave(env.request,v=>({...v,sections:v.sections.map(s=>s.id==="LINKS"?{...s,isVisible:true}:s)}));await click(tree,"Save Changes");expect(payload(env.request).sections.find((s:{id:string})=>s.id==="LINKS").isVisible).toBe(false);expect(preview(tree).viewModel.v2Sections.some((s:{id:string})=>s.id==="LINKS")).toBe(true);
 });
 it("saves section content and section appearance together without discarding either draft",async()=>{
  tree=await mount();await select(tree,"Gallery");await field(tree,"Heading on profile","Draft gallery");await select(tree,"LINKS");await click(tree,"Appearance");act(()=>tree.root.findByType(EssentialSectionAppearance).props.onChange({...data.sections[2],config:{visual:{layout:{gap:8}}}}));
  expect(env.request).not.toHaveBeenCalled();successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).sections.find((s:{id:string})=>s.id==="custom").visibleTitle).toBe("Draft gallery");expect(payload(env.request).sections.find((s:{id:string})=>s.id==="LINKS").config.visual.layout.gap).toBe(8);
 });
 it("edits canonical Contact locally and updates the single preview before Save Changes",async()=>{
  tree=await mount();await select(tree,"Contact");await field(tree,"Phone number","+355691234567");expect(preview(tree).viewModel.callHref).toBe("tel:+355691234567");expect(env.request).not.toHaveBeenCalled();successfulSave(env.request);await click(tree,"Save Changes");expect(payload(env.request).profile.phone).toBe("+355691234567");
 });
});
