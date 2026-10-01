import React from "react";
import TestRenderer,{act} from "react-test-renderer";
import {renderToStaticMarkup} from "react-dom/server";
import {expect,it,vi} from "vitest";
import {heroDesign} from "@/lib/profile-visual";
import {profileDesign} from "@/lib/profile-design";
import {snapshotCurrentDesign,themeSnapshotSchema,applyCustomTheme} from "@/lib/custom-themes";
import {HeaderVisualControls,ExactNumber,VisualChoice} from "@/components/admin/profile-builder/VisualControls";
import {VisualHeader} from "@/components/profile/VisualHeader";
import type {PublicBusinessProfile} from "@/lib/services/public-profile";
const design=profileDesign.parse({visual:{version:1,canvas:{background:"SOLID",color:"#ffffff"},hero:{padding:20,gap:8,composition:"MINIMAL"}}});
it("keeps legacy padding and accepts only bounded independent bottom padding",()=>{
 expect(heroDesign.parse({padding:20})).toEqual({padding:20});
 expect(heroDesign.parse({padding:20,paddingBottom:0})).toEqual({padding:20,paddingBottom:0});
 for(const paddingBottom of [-1,49])expect(heroDesign.safeParse({paddingBottom}).success).toBe(false);
});
it("changes only bottom padding; spacing presets preserve the explicit override",()=>{
 const change=vi.fn();let tree!:TestRenderer.ReactTestRenderer;
 act(()=>{tree=TestRenderer.create(<HeaderVisualControls value={design} onChange={change}/>)});
 const control=tree.root.findAllByType(ExactNumber).find(n=>n.props.label==="Bottom padding")!;
 expect(control.props.value).toBe(20);
 act(()=>control.props.onChange(0));
 expect(change.mock.lastCall![0].visual.hero).toEqual({...design.visual!.hero,paddingBottom:0});
 act(()=>tree.update(<HeaderVisualControls value={change.mock.lastCall![0]} onChange={change}/>));
 act(()=>tree.root.findAllByType(VisualChoice).find(n=>n.props.label==="Header spacing")!.props.onChange("32"));
 expect(change.mock.lastCall![0].visual.hero).toMatchObject({padding:32,paddingBottom:0,gap:8});
 act(()=>tree.unmount());
});
it("renders fallback and bottom override using the same shared Header",()=>{
 const business={name:"Example",profile:{displayName:"Example",isVerified:false}} as PublicBusinessProfile;
 const fallback=renderToStaticMarkup(<VisualHeader business={business} design={design.visual!}/>);
 const override=renderToStaticMarkup(<VisualHeader business={business} design={{...design.visual!,hero:{...design.visual!.hero,paddingBottom:0}}}/>);
 expect(fallback).toContain("padding:20px;padding-bottom:20px;gap:8px");
 expect(override).toContain("padding:20px;padding-bottom:0;gap:8px");
});
it("preserves bottom padding in reusable snapshots and application",()=>{
 const source={...design,visual:{...design.visual!,hero:{...design.visual!.hero,paddingBottom:0}}};
 const snapshot=themeSnapshotSchema.parse(snapshotCurrentDesign(source,null));
 expect(snapshot.visual.hero?.paddingBottom).toBe(0);
 const applied=applyCustomTheme(design,snapshot);
 expect(applied.visual?.hero).toMatchObject({padding:20,paddingBottom:0});
});
it("anchors covered overlay content without resizing its cover",()=>{
 const business={name:"Example",profile:{displayName:"Example",isVerified:false,coverImageUrl:"/cover.jpg"}} as PublicBusinessProfile;
 const html=renderToStaticMarkup(<VisualHeader business={business} design={{version:1,hero:{composition:"IMAGE_HERO",padding:20,paddingBottom:0,height:280,mobileHeight:280}}}/>);
 expect(html).toContain("margin-bottom:-20px");
 expect(html).toContain("bottom:20px;padding:20px;padding-bottom:0");
 expect(html).toContain("--hero-height:280px;--hero-mobile-height:280px");
});
