import React from "react";
import {act,create} from "react-test-renderer";
import {afterEach,expect,it,vi} from "vitest";
import {FooterEditor} from "@/components/admin/profile-builder/GlobalDesignControls";
import {CustomThemeControls} from "@/components/admin/profile-builder/CustomThemeControls";
import {applyCustomTheme,applyThemeSections,snapshotCurrentDesign} from "@/lib/custom-themes";
import {profileDesign} from "@/lib/profile-design";
import {referenceGlassDesign,referenceGlassFooter} from "@/lib/reference-glass-theme";
import {section} from "./helpers/builder-v3";

afterEach(()=>vi.unstubAllGlobals());
const buttonText=(node:ReturnType<typeof create>["root"]):string=>node.children.map(child=>typeof child==="string"?child:buttonText(child)).join("");

it("resets Footer appearance to its theme without changing text, visibility or any other design",()=>{
 const value=profileDesign.parse({...referenceGlassDesign,footer:{hidden:true,text:"Keep my message",visual:{decoration:"STAR"}}});
 const changed=vi.fn();let tree!:ReturnType<typeof create>;
 act(()=>{tree=create(<FooterEditor value={value} theme={value.theme} role="SUPER_ADMIN" showPolicy={false} tab="appearance" appearanceSource="Warm Glass" appearanceDefault={referenceGlassFooter.visual} onChange={changed}/>)});
 expect(changed).not.toHaveBeenCalled();
 act(()=>tree.root.findAllByType("button").find(node=>buttonText(node)==="Use Warm Glass Footer appearance")!.props.onClick());
 expect(changed.mock.lastCall![0]).toEqual({...value,footer:{...value.footer,visual:referenceGlassFooter.visual}});
 act(()=>tree.unmount());
});

it("uses platform text without resetting Footer appearance or visibility",()=>{
 const value=profileDesign.parse({...referenceGlassDesign,footer:{hidden:true,text:"Old text",visual:referenceGlassFooter.visual}});
 const changed=vi.fn();let tree!:ReturnType<typeof create>;
 act(()=>{tree=create(<FooterEditor value={value} theme={value.theme} role="SUPER_ADMIN" showPolicy={false} tab="content" onChange={changed}/>)});
 act(()=>tree.root.findAllByType("button").find(node=>buttonText(node)==="Use platform text")!.props.onClick());
 expect(changed.mock.lastCall![0]).toEqual({...value,footer:{...value.footer,text:""}});
 act(()=>tree.unmount());
});

it("does not offer a misleading appearance reset when the original theme is missing",()=>{
 let tree!:ReturnType<typeof create>;
 act(()=>{tree=create(<FooterEditor value={referenceGlassDesign} theme="CLASSIC" role="SUPER_ADMIN" showPolicy={false} tab="appearance" appearanceResetUnavailable onChange={vi.fn()}/>)});
 expect(tree.root.findAllByType("button").find(node=>buttonText(node).includes("Footer appearance"))!.props.disabled).toBe(true);
 act(()=>tree.unmount());
});

it("theme Apply keeps exact values and item styles; Reset clears styling but not content or composition",()=>{
 const target={...section("LINKS"),isVisible:false,position:4,config:{visual:{surface:{radius:31}},linkStyles:{first:{action:{chevron:false},subtitle:"Keep subtitle"}}},items:[{id:"text",kind:"TEXT" as const,position:0,width:"HALF" as const,isVisible:false,referencedProfileLinkId:null,images:[],config:{text:"Keep content",visual:{text:{size:23}},surface:{preset:"CARD"}}}]};
 const snapshot=snapshotCurrentDesign({...referenceGlassDesign,footer:referenceGlassFooter},null);
 const source=JSON.stringify(target);
 expect(applyThemeSections([target],snapshot)[0].config.linkStyles).toEqual(target.config.linkStyles);
 const reset=applyThemeSections([target],snapshot,true)[0];
 expect(reset).toMatchObject({id:target.id,isVisible:false,position:4,config:{linkStyles:{first:{subtitle:"Keep subtitle"}}},items:[{id:"text",width:"HALF",isVisible:false,config:{text:"Keep content"}}]});
 expect(reset.items[0].config).not.toHaveProperty("visual");expect(reset.items[0].config).not.toHaveProperty("surface");
 expect(JSON.stringify(target)).toBe(source);
 expect(applyCustomTheme(referenceGlassDesign,snapshot).visual?.surface?.radius).toBe(22);
 expect(applyCustomTheme(referenceGlassDesign,snapshot).visual?.action?.minHeight).toBe(70);
});

it("shares refreshed theme catalog with scope-specific editors without saving the profile",async()=>{
 const theme={id:"cm123456789012345678901234",name:"Updated library theme",description:null,design:snapshotCurrentDesign(referenceGlassDesign,null)};
 const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({themes:[theme]})});vi.stubGlobal("fetch",fetch);
 const catalog=vi.fn(),change=vi.fn();let tree!:ReturnType<typeof create>;
 await act(async()=>{tree=create(<CustomThemeControls design={referenceGlassDesign} accent="" themes={[]} onThemesChange={catalog} onChange={change} onAccentChange={vi.fn()}/>)});
 expect(catalog.mock.lastCall![0]).toEqual([theme]);expect(change).not.toHaveBeenCalled();
 expect(fetch).toHaveBeenCalledWith("/api/admin/custom-themes",expect.objectContaining({signal:expect.any(AbortSignal)}));
 act(()=>tree.unmount());
});
