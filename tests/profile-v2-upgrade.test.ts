import { beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({find:vi.fn(),raw:vi.fn(),update:vi.fn(),create:vi.fn(),count:vi.fn(),linkUpdate:vi.fn(),transaction:vi.fn()}));
const tx={businessProfile:{findUnique:m.find,update:m.update},profileSection:{createMany:m.create,count:m.count},profileLink:{update:m.linkUpdate},$queryRaw:m.raw};
vi.mock("@/lib/db",()=>({db:{businessProfile:{findUnique:m.find,update:m.update},profileSection:{createMany:m.create,count:m.count},profileLink:{update:m.linkUpdate},$queryRaw:m.raw,$transaction:m.transaction}}));
import { previewV2Upgrade, confirmV2Upgrade } from "@/lib/services/profile-v2-upgrade";
const keys=["BIO","CONTACT","LOCATION","REVIEWS","MENU","LINKS","BUSINESS_INFO"];
let p:ReturnType<typeof fixture>;
function fixture(){return{id:"p",builderVersion:1,phone:"+355691234567",website:"https://legacy.example",organization:{modules:[],menu:null},
  blockLayouts:keys.map((blockKey,position)=>({blockKey,position,isVisible:!["CONTACT","REVIEWS","LINKS"].includes(blockKey)})),
  links:[{id:"review",type:"GOOGLE_REVIEWS",isActive:true,url:"https://review.example"},{id:"website",type:"WEBSITE",isActive:true,url:"https://website.example"}]};}
beforeEach(()=>{vi.resetAllMocks();p=fixture();m.find.mockImplementation(async()=>p);m.count.mockResolvedValue(0);m.transaction.mockImplementation(async(cb:(c:typeof tx)=>unknown)=>cb(tx));});
describe("explicit V1 conversion safety",()=>{
  it("preview is read-only and preserves hidden contact/review/link gates",async()=>{
    const plan=await previewV2Upgrade("org");
    expect(plan.fields).toMatchObject({phone:false,whatsapp:false,website:false});
    expect(plan.links.every(l=>!l.visible)).toBe(true);expect(m.update).not.toHaveBeenCalled();expect(m.create).not.toHaveBeenCalled();
  });
  it("rejects a stale preview when content changes",async()=>{
    const plan=await previewV2Upgrade("org");p.phone="+355699999999";
    await expect(confirmV2Upgrade("org",plan.fingerprint)).rejects.toThrow("changed");expect(m.create).not.toHaveBeenCalled();
  });
  it("creates sections and version marker inside one serializable transaction",async()=>{
    const plan=await previewV2Upgrade("org");await confirmV2Upgrade("org",plan.fingerprint);
    expect(m.create.mock.calls[0][0].data).toHaveLength(4);
    expect(m.update.mock.calls[0][0].data).toMatchObject({builderVersion:2,layoutRevision:{increment:1}});
    expect(m.transaction.mock.calls[0][1]).toMatchObject({isolationLevel:"Serializable"});
    expect(m.linkUpdate.mock.calls.every(c=>Object.keys(c[0].data).join()==="v2IsVisible")).toBe(true);
  });
  it("does not repeat conversion after V2 was already activated",async()=>{
    p.builderVersion=2;await confirmV2Upgrade("org","old-fingerprint");
    expect(m.create).not.toHaveBeenCalled();expect(m.update).not.toHaveBeenCalled();
  });
  it("does not ignore unexpected existing V2 section records",async()=>{
    const plan=await previewV2Upgrade("org");m.count.mockResolvedValue(1);
    await expect(confirmV2Upgrade("org",plan.fingerprint)).rejects.toThrow("Unexpected");expect(m.update).not.toHaveBeenCalled();
  });
});
