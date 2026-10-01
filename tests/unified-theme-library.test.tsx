import React from "react";
import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import TestRenderer,{act} from "react-test-renderer";
import {profileDesign} from "@/lib/profile-design";
import {profilePresets} from "@/lib/profile-presets";
import {snapshotCurrentDesign,type CustomTheme} from "@/lib/custom-themes";
import {starterThemeLibrary,starterThemeId} from "@/lib/starter-theme-library";
import {EssentialDesignEditor} from "@/components/admin/profile-builder/EssentialDesignEditor";
import {CustomThemeControls} from "@/components/admin/profile-builder/CustomThemeControls";
const dbMocks=vi.hoisted(()=>({find:vi.fn(),create:vi.fn(),read:vi.fn(),transaction:vi.fn()}));
vi.mock("@/lib/db",()=>({db:{$transaction:dbMocks.transaction,customTheme:{findMany:dbMocks.read}}}));
import {materializeStarterThemes,listCustomThemes} from "@/lib/services/custom-themes";
const starters:CustomTheme[]=starterThemeLibrary.map(entry=>({id:entry.id,name:entry.name,description:null,design:snapshotCurrentDesign(profileDesign.parse({visual:profilePresets.find(p=>p.name===entry.name)!.visual}),null)}));
const saved:CustomTheme={...starters[0],id:"cm123456789012345678901234",name:"Harbor Blue"};
const catalog=[saved,...starters];
const legacy=()=>profileDesign.parse({visual:profilePresets[0].visual});
const props=()=>({design:legacy(),accent:"",themes:catalog,onChange:vi.fn(),onAccentChange:vi.fn(),isSuperAdmin:true,presetName:"Modern Minimal"});
const text=(n:TestRenderer.ReactTestInstance):string=>n.children.map(c=>typeof c==="string"?c:text(c)).join("");
let tree:TestRenderer.ReactTestRenderer|undefined;
beforeEach(()=>{dbMocks.find.mockReset();dbMocks.create.mockReset();dbMocks.read.mockReset();dbMocks.transaction.mockReset();dbMocks.transaction.mockImplementation(fn=>fn({customTheme:{findMany:dbMocks.find,createMany:dbMocks.create}}));vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({themes:catalog})}))});
afterEach(()=>{if(tree){act(()=>tree!.unmount());tree=undefined}vi.unstubAllGlobals()});
it("materializes six validated snapshots once without touching business data",async()=>{
 dbMocks.find.mockResolvedValue([]);dbMocks.create.mockResolvedValue({count:6});expect(await materializeStarterThemes()).toEqual({count:6});
 const entries=dbMocks.create.mock.lastCall?.[0].data;expect(entries).toHaveLength(6);
 for(const entry of entries){const original=starters.find(t=>t.id===entry.id)!;expect(entry.design).toEqual(original.design);expect(JSON.stringify(entry.design)).not.toMatch(/customThemeId|profileId|businessId|https?:/)}
 dbMocks.find.mockResolvedValue(starters.map(t=>({...t,nameKey:t.name.toLowerCase()})));await materializeStarterThemes();expect(dbMocks.create.mock.lastCall?.[0].data).toEqual([]);
});
it("preserves renamed/updated starters on explicit materialization and rejects name collisions atomically",async()=>{
 dbMocks.find.mockResolvedValue([{id:starters[0].id,nameKey:"renamed studio"}]);dbMocks.create.mockResolvedValue({count:5});await materializeStarterThemes();expect(dbMocks.create.mock.lastCall?.[0].data.some((row:CustomTheme)=>row.id===starters[0].id)).toBe(false);
 dbMocks.create.mockClear();dbMocks.find.mockResolvedValue([{id:saved.id,nameKey:"modern minimal"}]);await expect(materializeStarterThemes()).rejects.toThrow("No starter themes were added");expect(dbMocks.create).not.toHaveBeenCalled();
});
it("never seeds during reads, so deleted starters stay deleted",async()=>{
 dbMocks.read.mockResolvedValue([saved,...starters.slice(1)]);expect(await listCustomThemes()).toHaveLength(6);expect(dbMocks.transaction).not.toHaveBeenCalled();expect(dbMocks.create).not.toHaveBeenCalled();
});
it("renders exactly one Themes heading/grid with one instance of each theme and an add tile",()=>{
 const html=renderToStaticMarkup(<EssentialDesignEditor {...props()} customThemes={catalog} organizationId="org" backgroundUrl={null} coverUrl={null} onBackgroundChange={vi.fn()}/>);
 expect(html.match(/<h3>Themes<\/h3>/g)).toHaveLength(1);expect(html).not.toContain("Custom themes");expect(html.match(/class="builder-v3-themes"/g)).toHaveLength(1);
 for(const theme of catalog){expect(html.match(new RegExp(`<strong>${theme.name}</strong>`,"g"))).toHaveLength(1);expect(html).toContain(`Theme actions for ${theme.name}`)}
 expect(html).toContain("border-style:dashed");expect(html).toContain("Save current design as theme");
});
it("keeps legacy identity through renames; a deleted source has no immutable reset fallback",()=>{
 const renamed={...starters[0],name:"Renamed Starter"},unchanged=legacy(),before=JSON.stringify(unchanged);
 const html=renderToStaticMarkup(<CustomThemeControls {...props()} design={unchanged} themes={[renamed]}/>);expect(html).toContain("Based on Renamed Starter");expect(starterThemeId("Modern Minimal")).toBe(renamed.id);expect(JSON.stringify(unchanged)).toBe(before);
 const missing=renderToStaticMarkup(<CustomThemeControls {...props()} themes={[]}/>);expect(missing).toContain("original theme is unavailable");expect(missing).not.toContain("Reset Global Design");
 const explicitMissing=renderToStaticMarkup(<CustomThemeControls {...props()} design={{...unchanged,customThemeId:saved.id}} themes={[renamed]}/>);expect(explicitMissing).toContain("original theme is unavailable");expect(explicitMissing).not.toContain("Based on Renamed Starter");
});
it("uses the same Apply/Rename/Update/Delete flow for a starter; CRUD never saves a profile",async()=>{
 const p=props(),source=structuredClone(p.design),before=JSON.stringify(source);let stored=structuredClone(starters[0]);
 const request=vi.mocked(fetch);request.mockImplementation(async(_url,options)=>{
  if(!options?.method)return {ok:true,json:async()=>({themes:[stored]})} as Response;
  if(options.method==="DELETE")return {ok:true,json:async()=>({ok:true})} as Response;
  const body=JSON.parse(options.body as string);stored=body.action==="METADATA"?{...stored,name:body.name,description:body.description}:{...stored,design:body.design};return {ok:true,json:async()=>({theme:stored})} as Response;
 });
 const renderProps={...p,design:source,themes:[stored]};await act(async()=>{tree=TestRenderer.create(<CustomThemeControls {...renderProps}/>,{createNodeMock:e=>e.type==="dialog"?{showModal:vi.fn(),close:vi.fn()}:null})});
 const action=async(label:string)=>act(async()=>{tree!.root.findAllByType("button").find(b=>text(b)===label)!.props.onClick({currentTarget:{closest:()=>({removeAttribute:vi.fn()})}})});
 await action("Rename / details");act(()=>tree!.root.findByType("input").props.onChange({target:{value:"Renamed Starter"}}));await act(async()=>tree!.root.findByType("form").props.onSubmit({preventDefault:vi.fn()}));expect(stored.name).toBe("Renamed Starter");expect(p.onChange).not.toHaveBeenCalled();
 await action("Apply");expect(p.onChange.mock.lastCall?.[0].customThemeId).toBe(starters[0].id);p.onChange.mockClear();
 const edited={...source,customThemeId:stored.id,visual:{...source.visual!,canvas:{...source.visual!.canvas,color:"#19384a"}}};act(()=>tree!.update(<CustomThemeControls {...renderProps} design={edited}/>));
 await action("Update from current design");await act(async()=>tree!.root.findByType("form").props.onSubmit({preventDefault:vi.fn()}));expect(stored.design.visual.canvas?.color).toBe("#19384a");expect(p.onChange).not.toHaveBeenCalled();
 await action("Delete");expect(text(tree!.root.findByType("form"))).toContain("Existing profiles keep their appearance");await act(async()=>tree!.root.findByType("form").props.onSubmit({preventDefault:vi.fn()}));expect(tree!.root.findAllByType("strong").some(n=>text(n)==="Renamed Starter")).toBe(false);expect(p.onChange).not.toHaveBeenCalled();expect(JSON.stringify(source)).toBe(before);
 expect(request.mock.calls.filter(([,o])=>o?.method).every(([url])=>String(url).includes("/api/admin/custom-themes/"))).toBe(true);
});
