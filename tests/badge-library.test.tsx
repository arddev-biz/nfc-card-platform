import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {act,create} from "react-test-renderer";
import {it,expect,vi,afterEach} from "vitest";
import {badgeStyles} from "@/lib/badge-styles";
import {badgeDesign} from "@/lib/profile-visual";
import {VerificationBadge} from "@/components/profile/VerificationBadge";
import {BadgeStyleControls} from "@/components/admin/profile-builder/BadgeStyleControls";
import {PresetNumber} from "@/components/admin/profile-builder/PrecisionControls";
import {profileDesign} from "@/lib/profile-design";
import {snapshotCurrentDesign,applyCustomTheme,themeSnapshotSchema} from "@/lib/custom-themes";
import {referenceGlassDesign} from "@/lib/reference-glass-theme";
import {HeaderVisualControls} from "@/components/admin/profile-builder/VisualControls";
import {text} from "./helpers/builder-v3";
import {VerificationManager} from "@/components/admin/VerificationManager";
vi.mock("next/image",()=>({default:(props:any)=><img {...props}/>}));
vi.mock("next/link",()=>({default:({children,href}:any)=><a href={href}>{children}</a>}));
afterEach(()=>vi.unstubAllGlobals());
it.each(badgeStyles.filter(s=>s.fixedColor&&s.id!=="BETA"))("renders $name as a transparent accessible vector at every size",style=>{
 for(const size of [16,20,24,32,40]){
  expect(badgeDesign.parse({variant:style.id,size})).toEqual({variant:style.id,size});
  const html=renderToStaticMarkup(<VerificationBadge design={{variant:style.id,size}}/>);
  expect(html).toContain('data-badge-variant="'+style.id+'"');expect(html).toContain('width="'+size+'"');
  expect(html).not.toContain("<image");expect(html).not.toContain("<img");expect(html.match(/aria-label="Verified profile"/g)).toHaveLength(1);
  expect(html).toContain('aria-hidden="true"');expect(html).not.toContain("<rect");expect(html).not.toContain("filter=");
 }
});
it("retains the classic fallback and separate preset/custom size control",()=>{
 expect(renderToStaticMarkup(<VerificationBadge/>)).toEqual(renderToStaticMarkup(<VerificationBadge design={{variant:"CIRCLE"}}/>));
 const changed=vi.fn();let tree!:ReturnType<typeof create>;act(()=>{tree=create(<BadgeStyleControls value={{variant:"CRYSTAL",size:27}} onChange={changed}/>)});
 const chooser=tree.root.findAllByType("button").find(n=>n.props["aria-controls"]);expect(chooser!.props["aria-expanded"]).toBe(false);act(()=>chooser!.props.onClick());expect(tree.root.findAllByType("button").filter(n=>n.props["aria-pressed"]!==undefined&&n.findAllByType(VerificationBadge).length)).toHaveLength(badgeStyles.length);
 expect(tree.root.findByType(PresetNumber).findByType("details").props.open).toBe(false);
 expect(text(tree.root)).not.toContain("Badge color");expect(changed).not.toHaveBeenCalled();act(()=>tree.root.findAllByType("button").find(n=>n.findAllByType(VerificationBadge).some(b=>b.props.design.variant==="BETA"))!.props.onClick());expect(changed).toHaveBeenCalledWith({variant:"BETA",size:27});expect(chooser!.props["aria-expanded"]).toBe(false);act(()=>tree.unmount());
});
it("keeps Super Admin badge appearance out of theme snapshots and preserves it on apply",()=>{
 const design=profileDesign.parse({...referenceGlassDesign,visual:{...referenceGlassDesign.visual,badge:{variant:"GLOSSY_SHIELD",size:27}}});
 const snapshot=snapshotCurrentDesign(design,null);expect(snapshot.visual).not.toHaveProperty("badge");
 expect(themeSnapshotSchema.safeParse({...snapshot,visual:{...snapshot.visual,badge:{variant:"SHIELD",isVerified:true}}}).success).toBe(false);
 expect(applyCustomTheme(design,snapshot).visual?.badge).toEqual(design.visual?.badge);
});
it("previews badge appearance in Verification only and saves through its protected endpoint",async()=>{
 const request=vi.fn().mockResolvedValue({ok:true,json:async()=>({verification:{isVerified:true,verificationColor:"#2563EB",verificationBadge:"CRYSTAL",verificationBadgeSize:27}})});vi.stubGlobal("fetch",request);
 let tree!:ReturnType<typeof create>;act(()=>{tree=create(<VerificationManager entries={[{organizationId:"test",displayName:"Demo",isVerified:true,verificationColor:"#2563EB"}]}/>)});
 act(()=>tree.root.findByType(BadgeStyleControls).props.onChange({variant:"CRYSTAL",size:27}));expect(request).not.toHaveBeenCalled();
 expect(tree.root.findAllByType(VerificationBadge).some(n=>n.props.design?.variant==="CRYSTAL"&&n.props.design?.size===27)).toBe(true);
 await act(async()=>{await tree.root.findAllByType("button").find(n=>text(n)==="Save badge")!.props.onClick()});
 expect(request.mock.calls[0][0]).toBe("/api/admin/businesses/test/verification");expect(JSON.parse(request.mock.calls[0][1].body)).toMatchObject({isVerified:true,verificationBadge:"CRYSTAL",verificationBadgeSize:27});act(()=>tree.unmount());
 expect(renderToStaticMarkup(<HeaderVisualControls value={profileDesign.parse({})} onChange={()=>{}}/>)).not.toContain("Badge style");
});
