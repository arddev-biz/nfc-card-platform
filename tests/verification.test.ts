import { beforeEach,describe,expect,it,vi } from "vitest";
import { NextRequest } from "next/server";
const m=vi.hoisted(()=>({admin:vi.fn(),update:vi.fn(),find:vi.fn()}));
vi.mock("@/lib/auth/session",()=>({getAdminApiUser:m.admin}));
vi.mock("@/lib/db",()=>({db:{businessProfile:{update:m.update,findUniqueOrThrow:m.find}}}));
import { PATCH } from "@/app/api/admin/businesses/[id]/verification/route";
const request=(body:unknown)=>new NextRequest("http://localhost/api/admin/businesses/test/verification",{method:"PATCH",body:JSON.stringify(body)});
beforeEach(()=>{vi.resetAllMocks();m.admin.mockResolvedValue({role:"SUPER_ADMIN"});m.update.mockImplementation(async({data})=>data);});
describe("Super Admin verification API to persistence",()=>{
  it("saves vector style and exact size in existing visual JSON only",async()=>{
    m.find.mockResolvedValue({theme:"CLASSIC",designConfig:{visual:{version:1,badge:{color:"#123456",placement:"NAME"},hero:{padding:20}}}});
    const response=await PATCH(request({isVerified:true,verificationBadge:"CRYSTAL",verificationBadgeSize:27,verificationColor:"#abcdef"}),{params:{id:"test"}});
    expect(response.status).toBe(200);const data=m.update.mock.calls[0][0].data;
    expect(data.designConfig.visual.badge).toEqual({variant:"CRYSTAL",size:27,color:"#abcdef",placement:"NAME"});expect(data.designConfig.visual.hero.padding).toBe(20);expect(data).not.toHaveProperty("verificationBadgeSize");
  });
  it.each([true,false])("owners cannot alter verification or badge appearance (%s)",async isVerified=>{
    m.admin.mockResolvedValue({role:"BUSINESS_OWNER"});expect((await PATCH(request({isVerified,verificationBadge:"CRYSTAL",verificationBadgeSize:32}),{params:{id:"test"}})).status).toBe(401);expect(m.update).not.toHaveBeenCalled();expect(m.find).not.toHaveBeenCalled();
  });
  it.each([0,15,41,100,"24"])("rejects invalid badge size %s",async verificationBadgeSize=>{
    expect((await PATCH(request({isVerified:true,verificationBadgeSize}),{params:{id:"test"}})).status).toBe(400);expect(m.update).not.toHaveBeenCalled();
  });
  it("saves the beta alternative while preserving existing design and content",async()=>{
    m.find.mockResolvedValue({theme:"CLASSIC",designConfig:{theme:"CLASSIC",visual:{version:1,canvas:{color:"#123456"},badge:{size:30}}}});
    const response=await PATCH(request({isVerified:true,verificationBadge:"BETA"}),{params:{id:"test"}});
    expect(response.status).toBe(200);
    const data=m.update.mock.calls[0][0].data;
    expect(data.designConfig.visual.canvas).toEqual({color:"#123456"});
    expect(data.designConfig.visual.badge).toEqual({size:30,variant:"BETA"});
    expect(data).not.toHaveProperty("displayName");
    expect((await response.json()).verification.verificationBadge).toBe("BETA");
  });
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
