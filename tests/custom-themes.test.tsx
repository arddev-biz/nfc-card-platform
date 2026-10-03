import {expect,it,vi} from "vitest";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {profileDesign} from "@/lib/profile-design";
import {profilePresets} from "@/lib/profile-presets";
import {applyCustomTheme,createCustomThemeSchema,readCustomTheme,snapshotCurrentDesign,themeNameKey,themeSnapshotSchema} from "@/lib/custom-themes";
import {CustomThemeControls} from "@/components/admin/profile-builder/CustomThemeControls";
const id="cm123456789012345678901234";
const design=()=>profileDesign.parse({customThemeId:id,visual:{...profilePresets[0].visual,hero:{...profilePresets[0].visual.hero,tagline:"Private business",description:"Private description",showBusinessType:true},badge:{color:"#123456"}},footer:{text:"Private footer"}});
it("copies unsaved design without content, IDs, assets or policy",()=>{
 const source=design();source.visual!.canvas!.color="#123456";
 const snapshot=snapshotCurrentDesign(source,"#abcdef");
 expect(snapshot.visual.canvas?.color).toBe("#123456");expect(snapshot.accentColor).toBe("#abcdef");
 expect(JSON.stringify(snapshot)).not.toMatch(/Private|customThemeId|tagline|description|showBusinessType|badge|isVerified|verificationTooltip|footer|https?:|assetId|sectionId/);
 source.visual!.canvas!.color="#ffffff";expect(snapshot.visual.canvas?.color).toBe("#123456");
});
it("rejects non-allowlisted payloads on save and read",()=>{
 const snapshot=snapshotCurrentDesign(design(),null);
 for(const bad of [{...snapshot,url:"https://example.test"},{...snapshot,settings:{...snapshot.settings,customThemeId:id}},{...snapshot,visual:{...snapshot.visual,hero:{tagline:"Content"}}},{...snapshot,visual:{...snapshot.visual,canvas:{...snapshot.visual.canvas,url:"https://example.test"}}}]){
 expect(themeSnapshotSchema.safeParse(bad).success).toBe(false);expect(()=>readCustomTheme({id,name:"Theme",description:null,design:bad})).toThrow();
 }
 expect(createCustomThemeSchema.safeParse({name:"Theme",design:snapshot,businessId:id}).success).toBe(false);
});
it("preserves target content and badge when applying",()=>{
 const source=design(),snapshot=snapshotCurrentDesign(profileDesign.parse({visual:profilePresets[1].visual}),"#123456");
 const applied=applyCustomTheme(source,snapshot);
 expect(applied.visual?.hero?.tagline).toBe("Private business");expect(applied.footer).toMatchObject({text:source.footer?.text,hidden:source.footer?.hidden});expect(applied.footer?.visual?.decoration).toBe("NONE");expect(applied.visual?.badge).toEqual(source.visual?.badge);
 expect(applied.visual?.canvas).toEqual(snapshot.visual.canvas);expect(source.visual?.canvas?.color).not.toBe(applied.visual?.canvas?.color);
});
it("allows photo geometry but rejects unresolved legacy backgrounds",()=>{
 const target={...design(),hoverStyle:"GLOW" as const,backgroundPreset:"AURORA" as const};
 const plain=snapshotCurrentDesign(design(),null);
 const applied=applyCustomTheme(target,plain);
 expect(applied.hoverStyle).toBeUndefined();expect(applied.backgroundPreset).toBeUndefined();expect(snapshotCurrentDesign(applied,null)).toEqual({...plain,footerVisual:applied.footer?.visual});
 const source=design();source.visual!.canvas!.background="IMAGE";expect(snapshotCurrentDesign(source,null).visual.canvas?.background).toBe("IMAGE");
 expect(themeSnapshotSchema.safeParse({settings:{},visual:{version:1},accentColor:null}).success).toBe(false);
 source.visual!.canvas!.background="EXISTING";expect(()=>snapshotCurrentDesign(source,null)).toThrow();
});
it("normalizes names and validates identity metadata",()=>{
 expect(themeNameKey("  Studio   BLUE ")).toBe(themeNameKey("studio blue"));
 expect(profileDesign.parse({customThemeId:id}).customThemeId).toBe(id);expect(profileDesign.safeParse({customThemeId:"not-an-id"}).success).toBe(false);
});
it("shows creation only to Super Admin and restores identity",()=>{
 const theme={id,name:"Studio",description:null,design:snapshotCurrentDesign(design(),null)};
 const props={design:design(),accent:"",onChange:vi.fn(),onAccentChange:vi.fn(),themes:[theme]};
 expect(renderToStaticMarkup(<CustomThemeControls {...props}/>)).not.toContain("Save current design as theme");
 expect(renderToStaticMarkup(<CustomThemeControls {...props} isSuperAdmin/>)).toContain("Save current design as theme");
 expect(renderToStaticMarkup(<CustomThemeControls {...props}/>)).toContain("Based on Studio");
});
const mocks=vi.hoisted(()=>({session:vi.fn(),admin:vi.fn(),create:vi.fn(),list:vi.fn()}));
vi.mock("@/lib/auth/session",()=>({getSessionUser:mocks.session,getAdminApiUser:mocks.admin}));
vi.mock("@/lib/services/custom-themes",()=>({createCustomTheme:mocks.create,listCustomThemes:mocks.list}));
import {GET,POST} from "@/app/api/admin/custom-themes/route";
import {NextRequest} from "next/server";
it("enforces Super Admin creation and authenticated reads",async()=>{
 mocks.admin.mockResolvedValue({role:"BUSINESS_OWNER"});mocks.session.mockResolvedValue(null);
 expect((await POST(new NextRequest("http://localhost/api/admin/custom-themes",{method:"POST",body:"{}"}))).status).toBe(401);
 expect(mocks.create).not.toHaveBeenCalled();expect((await GET()).status).toBe(401);
 mocks.session.mockResolvedValue({role:"ADMIN"});mocks.list.mockResolvedValue([]);expect((await GET()).status).toBe(200);
});
it("returns created theme through separate theme endpoint",async()=>{
 mocks.admin.mockResolvedValue({role:"SUPER_ADMIN"});const theme={id,name:"Studio",description:null,design:snapshotCurrentDesign(design(),null)};mocks.create.mockResolvedValue(theme);
 const response=await POST(new NextRequest("http://localhost/api/admin/custom-themes",{method:"POST",body:JSON.stringify({name:theme.name,design:theme.design})}));
 expect(response.status).toBe(201);expect((await response.json()).theme).toEqual(theme);
});
