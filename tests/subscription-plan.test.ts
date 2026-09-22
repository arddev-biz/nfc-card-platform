import {beforeEach,describe,it,expect,vi} from "vitest";
import {NextRequest} from "next/server";
const m=vi.hoisted(()=>({admin:vi.fn(),find:vi.fn(),update:vi.fn(),raw:vi.fn()}));
vi.mock("@/lib/auth/session",()=>({getAdminApiUser:m.admin}));
vi.mock("@/lib/db",()=>({db:{$transaction:async(callback:(tx:unknown)=>unknown)=>callback({$queryRaw:m.raw,subscription:{findFirst:m.find,update:m.update}})}}));
import {PATCH} from "@/app/api/admin/businesses/[id]/subscription/route";
const req=(body:unknown)=>new NextRequest("http://localhost/api/admin/businesses/test/subscription",{method:"PATCH",body:JSON.stringify(body)});
beforeEach(()=>{vi.resetAllMocks();m.admin.mockResolvedValue({role:"SUPER_ADMIN"});m.find.mockResolvedValue({id:"existing"});});
describe("subscription plan administration",()=>{
  it.each([null,{role:"BUSINESS_OWNER"}])("denies non Super Admin callers",async user=>{m.admin.mockResolvedValue(user);expect((await PATCH(req({plan:"premium"}),{params:{id:"test"}})).status).toBe(401);expect(m.update).not.toHaveBeenCalled();});
  it("changes only plan on the latest owned subscription",async()=>{
    expect((await PATCH(req({plan:"premium"}),{params:{id:"test"}})).status).toBe(200);
    expect(m.find.mock.calls[0][0]).toMatchObject({where:{organizationId:"test"},orderBy:[{createdAt:"desc"},{id:"desc"}]});
    expect(m.update).toHaveBeenCalledWith({where:{id:"existing"},data:{plan:"premium"}});
  });
  it("does not create subscriptions or change dates when none exists",async()=>{m.find.mockResolvedValue(null);expect((await PATCH(req({plan:"premium"}),{params:{id:"test"}})).status).toBe(400);expect(m.update).not.toHaveBeenCalled();});
  it("rejects unrelated administrative writes",async()=>{expect((await PATCH(req({plan:"premium",status:"ACTIVE"}),{params:{id:"test"}})).status).toBe(400);expect(m.update).not.toHaveBeenCalled();});
});
