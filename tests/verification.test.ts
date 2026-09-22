import { beforeEach,describe,expect,it,vi } from "vitest";
import { NextRequest } from "next/server";
const m=vi.hoisted(()=>({admin:vi.fn(),update:vi.fn()}));
vi.mock("@/lib/auth/session",()=>({getAdminApiUser:m.admin}));
vi.mock("@/lib/db",()=>({db:{businessProfile:{update:m.update}}}));
import { PATCH } from "@/app/api/admin/businesses/[id]/verification/route";
const request=(body:unknown)=>new NextRequest("http://localhost/api/admin/businesses/test/verification",{method:"PATCH",body:JSON.stringify(body)});
beforeEach(()=>{vi.resetAllMocks();m.admin.mockResolvedValue({role:"SUPER_ADMIN"});m.update.mockImplementation(async({data})=>data);});
describe("Super Admin verification API to persistence",()=>{
  it("persists a custom tooltip and clears it without touching content",async()=>{
    await PATCH(request({isVerified:true,verificationTooltip:"Reviewed manually"}),{params:{id:"test"}});
    expect(m.update.mock.calls[0][0].data.verificationTooltip).toBe("Reviewed manually");
    await PATCH(request({isVerified:true,verificationTooltip:""}),{params:{id:"test"}});
    expect(m.update.mock.calls[1][0].data.verificationTooltip).toBeNull();
  });
  it.each(["<b>Unsafe</b>","x".repeat(201)])("rejects unsafe/overlong tooltip",async verificationTooltip=>{
    expect((await PATCH(request({isVerified:true,verificationTooltip}),{params:{id:"test"}})).status).toBe(400);
    expect(m.update).not.toHaveBeenCalled();
  });
  it.each([null,{role:"BUSINESS_OWNER"}])("rejects non-admin callers before any write: %j",async user=>{m.admin.mockResolvedValue(user);const response=await PATCH(request({isVerified:true}),{params:{id:"test"}});expect(response.status).toBe(401);expect(m.update).not.toHaveBeenCalled();});
  it("persists verification independently from theme with default blue",async()=>{const response=await PATCH(request({isVerified:true}),{params:{id:"test"}});expect(response.status).toBe(200);expect(m.update).toHaveBeenCalledWith({where:{organizationId:"test"},data:{isVerified:true,verificationColor:"#2563EB"},select:{isVerified:true,verificationColor:true,verificationTooltip:true}});expect(await response.json()).toEqual({verification:{isVerified:true,verificationColor:"#2563EB"}});});
  it("removes verification and persists custom badge color without touching content",async()=>{await PATCH(request({isVerified:false,verificationColor:"#AABBCC"}),{params:{id:"test"}});expect(m.update.mock.calls[0][0].data).toEqual({isVerified:false,verificationColor:"#AABBCC"});});
  it.each([{isVerified:true,verificationColor:"red"},{isVerified:"true"},{isVerified:true,builderVersion:2}])("rejects invalid or unrelated input %j",async input=>{expect((await PATCH(request(input),{params:{id:"test"}})).status).toBe(400);expect(m.update).not.toHaveBeenCalled();});
  it("does not pretend persistence succeeded on a database error",async()=>{m.update.mockRejectedValue(new Error("private database details"));const response=await PATCH(request({isVerified:true}),{params:{id:"test"}});expect(response.status).toBe(400);expect(JSON.stringify(await response.json())).not.toContain("private database");});
});
