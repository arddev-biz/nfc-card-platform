import {expect,it,vi} from "vitest";
import {NextRequest} from "next/server";
import {profileDesign} from "@/lib/profile-design";
import {snapshotCurrentDesign,updateCustomThemeSchema,applyCustomTheme} from "@/lib/custom-themes";
const mocks=vi.hoisted(()=>({admin:vi.fn(),update:vi.fn(),remove:vi.fn()}));
vi.mock("@/lib/auth/session",()=>({getAdminApiUser:mocks.admin}));
vi.mock("@/lib/db",()=>({db:{customTheme:{update:mocks.update,delete:mocks.remove}}}));
import {updateCustomTheme,deleteCustomTheme} from "@/lib/services/custom-themes";
import {PATCH,DELETE} from "@/app/api/admin/custom-themes/[id]/route";
const id="cm123456789012345678901234",snapshot=()=>snapshotCurrentDesign(profileDesign.parse({visual:{version:1,canvas:{background:"GRADIENT",color:"#123456",gradientColor:"#abcdef",gradientAngle:270}}}),null);
it("separates metadata from reusable design and rejects extra ownership",()=>{
 expect(updateCustomThemeSchema.safeParse({action:"METADATA",name:"Studio",design:snapshot()}).success).toBe(false);
 expect(updateCustomThemeSchema.safeParse({action:"DESIGN",design:snapshot(),businessId:id}).success).toBe(false);
});
it("updates only theme metadata or design, never profiles; delete only removes library entry",async()=>{
 const design=snapshot(),profile=applyCustomTheme(profileDesign.parse({visual:{version:1,hero:{tagline:"Own content"}}}),design),before=JSON.stringify(profile);
 mocks.update.mockResolvedValue({id,name:"Studio",description:null,design});
 await updateCustomTheme(id,{action:"METADATA",name:" Studio ",description:"Notes"});expect(mocks.update.mock.lastCall?.[0].data).toEqual({name:"Studio",nameKey:"studio",description:"Notes"});
 await updateCustomTheme(id,{action:"DESIGN",design});expect(mocks.update.mock.lastCall?.[0].data).toEqual({design});
 await deleteCustomTheme(id);expect(mocks.remove).toHaveBeenLastCalledWith({where:{id}});expect(JSON.stringify(profile)).toBe(before);
});
it("requires Super Admin for both direct management endpoints",async()=>{
 mocks.admin.mockResolvedValue({role:"ADMIN"});const context={params:{id}},req=new NextRequest(`http://localhost/api/admin/custom-themes/${id}`,{method:"PATCH",body:"{}"});
 expect((await PATCH(req,context)).status).toBe(401);expect((await DELETE(req,context)).status).toBe(401);
 mocks.admin.mockResolvedValue({role:"SUPER_ADMIN"});mocks.update.mockResolvedValue({id,name:"Studio",description:null,design:snapshot()});
 expect((await PATCH(new NextRequest(req.url,{method:"PATCH",body:JSON.stringify({action:"METADATA",name:"Studio"})}),context)).status).toBe(200);
 expect((await DELETE(req,context)).status).toBe(200);
});
