import React from "react";
import {act,create} from "react-test-renderer";
import {renderToStaticMarkup} from "react-dom/server";
import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {NextRequest} from "next/server";
const mocks=vi.hoisted(()=>({count:vi.fn(),findMany:vi.fn(),updateMany:vi.fn(),admin:vi.fn()}));
vi.mock("@/lib/db",()=>({db:{lead:{count:mocks.count,findMany:mocks.findMany,updateMany:mocks.updateMany}}}));
vi.mock("@/lib/auth/session",()=>({getAdminApiUser:mocks.admin}));
vi.mock("next/navigation",()=>({usePathname:()=>"/admin"}));
vi.mock("next/link",()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
import {countUnseenLeads,unseenLeadSnapshot,acknowledgeLeads} from "@/lib/services/leads";
import {GET,POST} from "@/app/api/admin/leads/notifications/route";
import {SidebarNav} from "@/components/admin/Sidebar";
import {AcknowledgeLeadSnapshot,useUnseenLeadCount} from "@/components/admin/LeadNotifications";
beforeEach(()=>{vi.resetAllMocks();mocks.admin.mockResolvedValue({role:"SUPER_ADMIN"});mocks.count.mockResolvedValue(0)});
afterEach(()=>vi.unstubAllGlobals());
it("counts unseen records independently of business status",async()=>{
 mocks.count.mockResolvedValue(3);expect(await countUnseenLeads()).toBe(3);expect(mocks.count).toHaveBeenCalledWith({where:{seenAt:null}});
 await unseenLeadSnapshot();expect(mocks.findMany).toHaveBeenCalledWith({where:{seenAt:null},select:{id:true}});
});
it("acknowledges only the opening snapshot, preserves seen timestamps and leaves later leads unseen",async()=>{
 const rows=[{id:"old",seenAt:null,status:"CONTACTED"},{id:"later",seenAt:null,status:"NEW"},{id:"seen",seenAt:new Date(0),status:"CLOSED"}];
 mocks.updateMany.mockImplementation(({where,data})=>{for(const row of rows)if(where.id.in.includes(row.id)&&row.seenAt===null)row.seenAt=data.seenAt});
 mocks.count.mockImplementation(()=>rows.filter(r=>r.seenAt===null).length);
 expect(await acknowledgeLeads(["old","seen"])).toBe(1);expect(rows[0].status).toBe("CONTACTED");expect(rows[1].seenAt).toBeNull();expect(rows[2].seenAt).toEqual(new Date(0));
 expect(await acknowledgeLeads(["later"])).toBe(0);rows.push({id:"future",seenAt:null,status:"NEW"});expect(await countUnseenLeads()).toBe(1);
 expect(mocks.updateMany).toHaveBeenCalledWith({where:{id:{in:["old","seen"]},seenAt:null},data:{seenAt:expect.any(Date)}});
});
it("enforces admin authorization for both notification operations",async()=>{
 mocks.admin.mockResolvedValue(null);expect((await GET(new NextRequest("http://localhost/api/admin/leads/notifications"))).status).toBe(401);expect((await POST(new NextRequest("http://localhost/api/admin/leads/notifications",{method:"POST",body:JSON.stringify({ids:["a"]})}))).status).toBe(401);expect(mocks.count).not.toHaveBeenCalled();expect(mocks.updateMany).not.toHaveBeenCalled();
});
it("rejects invalid acknowledgement and prevents caching of counts",async()=>{
 expect((await GET(new NextRequest("http://localhost/api/admin/leads/notifications"))).headers.get("Cache-Control")).toContain("no-store");expect((await POST(new NextRequest("http://localhost/api/admin/leads/notifications",{method:"POST",body:'{"ids":"all"}'}))).status).toBe(400);expect(mocks.updateMany).not.toHaveBeenCalled();
});
it("renders compact capped badges with singular/plural accessible names",()=>{
 expect(renderToStaticMarkup(<SidebarNav unseenLeadCount={0}/>)).not.toContain("admin-lead-notification");
 for(const [count,label,text] of [[1,"1 new lead","1"],[2,"2 new leads","2"],[105,"105 new leads","99+"]] as const){const html=renderToStaticMarkup(<SidebarNav unseenLeadCount={count}/>);expect(html).toContain(`aria-label="Leads, ${label}"`);expect(html).toContain(`class="admin-lead-notification">${text}</span>`)}
});
it("does not acknowledge prefetched server markup, acknowledges on mount and refreshes the real count",async()=>{
 const events=new Map<string,()=>void>();vi.stubGlobal("window",{addEventListener:(name:string,fn:()=>void)=>events.set(name,fn),removeEventListener:(name:string)=>events.delete(name),dispatchEvent:(event:Event)=>{events.get(event.type)?.();return true}});
 let count=2;const fetcher=vi.fn(async(_url:string,options:any)=>{if(options?.method==="POST")count=1;return {ok:true,json:async()=>({count,ids:["old"]})}});vi.stubGlobal("fetch",fetcher);
 renderToStaticMarkup(<AcknowledgeLeadSnapshot/>);expect(fetcher).not.toHaveBeenCalled();
 function Count(){return <span>{useUnseenLeadCount()}</span>}
 let tree!:ReturnType<typeof create>;await act(async()=>{tree=create(<><Count/><AcknowledgeLeadSnapshot/></>)});expect(tree.root.findByType("span").children).toEqual(["1"]);expect(fetcher).toHaveBeenCalledWith("/api/admin/leads/notifications",expect.objectContaining({method:"POST",body:JSON.stringify({ids:["old"]})}));await act(async()=>tree.unmount());
});
