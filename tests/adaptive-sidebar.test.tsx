import React from "react";
import {act,create} from "react-test-renderer";
import {afterEach,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
const router=vi.hoisted(()=>({push:vi.fn(),refresh:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>router,usePathname:()=>"/admin/businesses/test"}));
vi.mock("next/link",()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
vi.mock("@/components/admin/ThemeToggle",()=>({ThemeToggle:()=>null}));
vi.mock("@/components/admin/LeadNotifications",()=>({useUnseenLeadCount:()=>0}));
vi.mock("@/components/ui/Toast",()=>({ToastProvider:({children}:any)=>children}));
import {AdminShell} from "@/components/admin/AdminShell";
import {SidebarNav} from "@/components/admin/Sidebar";
import {LogoutButton} from "@/components/admin/LogoutButton";
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks()});
it("adapts at exact desktop boundaries and restores the preferred mode",()=>{
 let measure=()=>{};const storage=new Map<string,string>();const node={clientWidth:1920,querySelector:()=>({}),contains:()=>false},win={innerWidth:1920},doc={documentElement:{clientWidth:1920}};
 vi.stubGlobal("window",win);vi.stubGlobal("document",doc);
 vi.stubGlobal("localStorage",{getItem:(key:string)=>storage.get(key),setItem:(key:string,value:string)=>storage.set(key,value)});
 vi.stubGlobal("ResizeObserver",class{constructor(fn:()=>void){measure=fn}observe(){}disconnect(){}});
 vi.stubGlobal("MutationObserver",class{observe(){}disconnect(){}});
 let tree!:ReturnType<typeof create>;act(()=>{tree=create(<AdminShell email="demo@example.test"><div className="builder-v3"/></AdminShell>,{createNodeMock:()=>node})});
 const mode=()=>tree.root.find(n=>n.props["data-sidebar-mode"]!==undefined).props["data-sidebar-mode"];
 const resize=(width:number)=>{node.clientWidth=width;win.innerWidth=width;doc.documentElement.clientWidth=width;measure()};
 for(const [width,expected] of [[1280,"hidden"],[1366,"collapsed"],[1440,"collapsed"],[1536,"collapsed"],[1600,"expanded"],[1920,"expanded"]] as const){act(()=>resize(width));expect(mode()).toBe(expected)}
 act(()=>tree.root.findAllByType("button").find(n=>n.props["aria-label"]==="Collapse navigation")!.props.onClick());expect(mode()).toBe("collapsed");expect(storage.get("admin-sidebar-preference")).toBe("collapsed");
 act(()=>resize(1280));expect(mode()).toBe("hidden");
 const shell=()=>tree.root.find(n=>n.props["data-sidebar-mode"]!==undefined);
 expect(shell().props.onClickCapture).toBeUndefined();
 act(()=>tree.root.findAllByType("button").find(n=>n.props["aria-label"]==="Show admin navigation")!.props.onClick());expect(shell().props["data-sidebar-revealed"]).toBe(true);expect(storage.get("admin-sidebar-preference")).toBe("collapsed");
 act(()=>resize(1920));expect(mode()).toBe("collapsed");act(()=>resize(1280));expect(shell().props["data-sidebar-revealed"]).toBeUndefined();act(()=>tree.unmount());
});
it("retains named navigation links and active destinations",()=>{
 const html=renderToStaticMarkup(<SidebarNav/>);expect(html).toContain('aria-label="Businesses"');expect(html).toContain('title="Businesses"');expect(html).toContain('href="/admin/verification"');expect(html).toContain("bg-[var(--admin-accent)]");
});
it("does not log out when the draft guard cancels",async()=>{
 const dispatch=vi.fn().mockReturnValue(false),request=vi.fn();vi.stubGlobal("document",{dispatchEvent:dispatch});vi.stubGlobal("fetch",request);let tree!:ReturnType<typeof create>;act(()=>{tree=create(<LogoutButton/>)});await act(async()=>tree.root.findByType("button").props.onClick());expect(dispatch.mock.calls[0][0].type).toBe("admin-before-logout");expect(request).not.toHaveBeenCalled();expect(router.push).not.toHaveBeenCalled();act(()=>tree.unmount());
});
