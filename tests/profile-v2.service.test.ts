import { beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({
  profile:vi.fn(),profileUpdate:vi.fn(),raw:vi.fn(),transaction:vi.fn(),subscription:vi.fn(),
  sectionCreate:vi.fn(),sectionUpdate:vi.fn(),sectionDelete:vi.fn(),
  itemCreate:vi.fn(),itemUpdate:vi.fn(),itemDelete:vi.fn(),itemUpdateMany:vi.fn(),
  imageCreate:vi.fn(),imageUpdate:vi.fn(),imageDelete:vi.fn(),
  asset:vi.fn(),linkCreate:vi.fn(),linkUpdate:vi.fn(),linkUpdateMany:vi.fn(),linkDelete:vi.fn(),
}));
const tx={
  subscription:{findFirst:m.subscription},
  businessProfile:{findUnique:m.profile,update:m.profileUpdate},$queryRaw:m.raw,
  profileSection:{create:m.sectionCreate,update:m.sectionUpdate,delete:m.sectionDelete},
  profileSectionItem:{create:m.itemCreate,update:m.itemUpdate,delete:m.itemDelete,updateMany:m.itemUpdateMany},
  profileItemImage:{create:m.imageCreate,update:m.imageUpdate,delete:m.imageDelete},
  profileAsset:{findFirst:m.asset},
  profileLink:{create:m.linkCreate,update:m.linkUpdate,updateMany:m.linkUpdateMany,delete:m.linkDelete},
};
vi.mock("@/lib/db",()=>({db:{$transaction:m.transaction}}));
import { mutateV2, initialV2Sections } from "@/lib/services/profile-v2";
const link=(id:string,socialSectionId:string|null=null,type="CUSTOM",isActive=true)=>({id,type,label:id,url:"https://example.com",isActive,sortOrder:0,socialSectionId,v2IsVisible:true,width:"FULL",iconMode:"DEFAULT",customIconAssetId:null,socialNetwork:null,customIconAsset:null});
const image={id:"image",businessProfileId:"p",assetId:"asset",position:0,alt:"",caption:null,destinationUrl:null,asset:{url:"https://image.example.com"}};
const item={id:"item",sectionId:"custom",kind:"CAROUSEL",position:0,width:"FULL",isVisible:true,config:{},referencedProfileLinkId:null,images:[image]};
const custom={id:"custom",kind:"CUSTOM",singletonKey:null,internalName:"Custom",visibleTitle:null,position:1,isVisible:true,config:{},items:[item]};
const core={...custom,id:"bio",kind:"CORE",singletonKey:"BIO",items:[]};
let profile:ReturnType<typeof fixture>;
function fixture(){return {id:"p",organizationId:"org",builderVersion:2,layoutRevision:0,theme:"CLASSIC",sections:[core,custom],links:[link("one"),link("two",null,"CUSTOM",false)]};}
const pres={width:"FULL" as const,iconMode:"DEFAULT" as const,customIconAssetId:null,socialSectionId:null,socialNetwork:null,v2IsVisible:true};
beforeEach(()=>{
  vi.resetAllMocks();profile=fixture();m.profile.mockImplementation(async()=>profile);
  m.transaction.mockImplementation(async(callback:(client:typeof tx)=>unknown)=>callback(tx));
});
describe("V2 transactional ownership and persistence",()=>{
  it("rejects premium footer writes without entitlement before persisting design",async()=>{
    m.subscription.mockResolvedValue(null);
    await expect(mutateV2("org",0,{op:"design",data:{theme:"CLASSIC",iconStyle:"OUTLINE",radius:"DEFAULT",density:"COMFORTABLE",surface:"SOFT",footer:{hidden:true,text:""}}})).rejects.toThrow();
    expect(m.profileUpdate).not.toHaveBeenCalled();
  });
  it("persists premium footer only with a current owned subscription",async()=>{
    m.subscription.mockResolvedValue({plan:"premium",status:"ACTIVE",startDate:new Date(0),endDate:new Date("2099-01-01")});
    await mutateV2("org",0,{op:"design",data:{theme:"CLASSIC",iconStyle:"OUTLINE",radius:"DEFAULT",density:"COMFORTABLE",surface:"SOFT",footer:{hidden:true,text:""}}});
    expect(m.subscription.mock.calls[0][0].where).toEqual({organizationId:"org"});
    expect(m.profileUpdate.mock.calls[0][0].data.designConfig.footer.hidden).toBe(true);
  });
  it("persists validated 3D design metadata without changing the legacy theme column",async()=>{
    const data={theme:"DIMENSIONAL" as const,iconStyle:"ROUNDED" as const,radius:"PILL" as const,density:"COMPACT" as const,surface:"SOFT" as const};
    await mutateV2("org",0,{op:"design",data});
    expect(m.profileUpdate.mock.calls[0][0]).toEqual({where:{id:"p"},data:{designConfig:data}});
  });
  it("adds a canonical Menu presentation without copying Menu content",async()=>{
    await mutateV2("org",0,{op:"item-create",sectionId:"custom",data:{kind:"MENU",width:"HALF",isVisible:true,config:{label:"Our Menu"},referencedProfileLinkId:null}});
    expect(m.itemCreate.mock.calls[0][0].data).toMatchObject({kind:"MENU",config:{label:"Our Menu"},referencedProfileLinkId:null});
    expect(m.linkCreate).not.toHaveBeenCalled();
  });
  it("initializes exactly four core singletons without legacy cards",()=>expect(initialV2Sections().map(s=>s.singletonKey)).toEqual(["BIO","BUSINESS_INFO","LINKS","MENU"]));
  it("rejects writes to V1 without auto-conversion",async()=>{profile.builderVersion=1;await expect(mutateV2("org",0,{op:"theme",theme:"CLASSIC"})).rejects.toThrow("upgrade");expect(m.profileUpdate).not.toHaveBeenCalled();});
  it("rejects stale revisions",async()=>{profile.layoutRevision=2;await expect(mutateV2("org",0,{op:"theme",theme:"CLASSIC"})).rejects.toThrow("changed");expect(m.profileUpdate).not.toHaveBeenCalled();});
  it("rejects foreign section IDs before any write",async()=>{await expect(mutateV2("org",0,{op:"section-delete",id:"foreign"})).rejects.toThrow("not found");expect(m.sectionDelete).not.toHaveBeenCalled();});
  it("keeps core sections undeletable",async()=>{await expect(mutateV2("org",0,{op:"section-delete",id:"bio"})).rejects.toThrow("hidden");});
  it("duplicates Custom items with new IDs and shared owned assets",async()=>{
    await mutateV2("org",0,{op:"section-duplicate",id:"custom"});
    const data=m.sectionCreate.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("id");expect(data.items.create[0]).not.toHaveProperty("id");
    expect(data.items.create[0].images.create[0].assetId).toBe("asset");expect(m.linkCreate).not.toHaveBeenCalled();
  });
  it("reorders all sections by owned IDs and increments revision",async()=>{
    await mutateV2("org",0,{op:"section-order",orderedIds:["custom","bio"]});
    expect(m.sectionUpdate.mock.calls.map(c=>c[0])).toEqual([{where:{id:"custom"},data:{position:0}},{where:{id:"bio"},data:{position:1}}]);
    expect(m.profileUpdate).toHaveBeenCalledWith({where:{id:"p"},data:{layoutRevision:{increment:1}}});
    expect(m.raw).toHaveBeenCalled();
  });
  it("rejects omitted inactive links during scoped reorder",async()=>{await expect(mutateV2("org",0,{op:"link-order",socialSectionId:null,orderedIds:["one"]})).rejects.toThrow("Order");expect(m.linkUpdate).not.toHaveBeenCalled();});
  it("keeps other section link slots unchanged",async()=>{
    profile.links=[link("one"),link("social","social"),link("two",null,"CUSTOM",false)];
    await mutateV2("org",0,{op:"link-order",socialSectionId:null,orderedIds:["two","one"]});
    expect(m.linkUpdate.mock.calls.map(c=>c[0].where.id)).toEqual(["two","social","one"]);
  });
  it("preserves singleton Reviews protection",async()=>{
    profile.links=[link("reviews",null,"GOOGLE_REVIEWS")];
    await expect(mutateV2("org",0,{op:"link-save",id:null,data:{type:"GOOGLE_REVIEWS",value:"https://example.com/review"},presentation:pres})).rejects.toThrow("singleton");
  });
  it("rejects foreign custom icon assets",async()=>{
    m.asset.mockResolvedValue(null);
    await expect(mutateV2("org",0,{op:"link-presentation",id:"one",data:{...pres,iconMode:"CUSTOM",customIconAssetId:"foreign"}})).rejects.toThrow("not found");
    expect(m.asset).toHaveBeenCalledWith({where:{id:"foreign",businessProfileId:"p"}});
  });
  it("rejects attaching images outside the owned graph",async()=>{
    await expect(mutateV2("org",0,{op:"image-create",itemId:"foreign",data:{assetId:"asset",alt:"",caption:null,destinationUrl:null}})).rejects.toThrow("not found");
  });
  it("rejects image reorder omission and duplicate IDs",async()=>{
    await expect(mutateV2("org",0,{op:"image-order",itemId:"item",orderedIds:[]})).rejects.toThrow("Order");
    await expect(mutateV2("org",0,{op:"image-order",itemId:"item",orderedIds:["image","image"]})).rejects.toThrow("Order");
  });
  it("hides custom references when their canonical link is explicitly deleted",async()=>{
    await mutateV2("org",0,{op:"link-delete",id:"one"});
    expect(m.itemUpdateMany).toHaveBeenCalledWith({where:{businessProfileId:"p",referencedProfileLinkId:"one"},data:{referencedProfileLinkId:null,isVisible:false}});
  });
  it("clears canonical fields without deleting any legacy link record",async()=>{
    await mutateV2("org",0,{op:"info",data:{phone:"",email:"",whatsapp:"",website:"",address:"",googleMapsUrl:""}});
    expect(m.profileUpdate.mock.calls[0][0].data).toMatchObject({phone:null,email:null,address:null,googleMapsUrl:null,website:null,whatsapp:null});
    expect(m.linkDelete).not.toHaveBeenCalled();expect(m.linkUpdateMany).toHaveBeenCalledTimes(4);
  });
  it("validates structured item configs in the service too",async()=>{
    await expect(mutateV2("org",0,{op:"item-create",sectionId:"custom",data:{kind:"LINK",isVisible:true,width:"FULL",referencedProfileLinkId:null,config:{url:"javascript:alert(1)"}}})).rejects.toThrow();
    expect(m.itemCreate).not.toHaveBeenCalled();
  });
});
