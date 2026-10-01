import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {expect,it,vi} from "vitest";
import PublicMenuPage from "@/app/[businessSlug]/menu/page";
import {getPublicMenu} from "@/lib/services/public-menu";
import {profileDesign} from "@/lib/profile-design";
vi.mock("@/lib/services/public-menu",()=>({getPublicMenu:vi.fn()}));
vi.mock("next/navigation",()=>({notFound:()=>{throw new Error("Not found")}}));
const design=profileDesign.parse({visual:{version:1,canvas:{background:"SOLID",color:"#101827",appearance:"DARK"},typography:{body:{color:"#f5f7fc"},heading:{color:"#f5f7fc"}},surface:{variant:"SOLID",color:"#ffffff"},action:{textColor:"#172033"}}});
const menu={businessName:"Example",themeColor:"#123456",theme:design.theme,design,backgroundMode:"LIGHT" as const,background:{backgroundType:"SOLID" as const,backgroundColor:null,backgroundGradient:null,backgroundImageUrl:null,coverImageUrl:null,backgroundMode:"LIGHT" as const},menuName:"Menu",menuDescription:"Description",categories:[{id:"cat",name:"Coffee",description:"Fresh",items:[{id:"item",name:"Espresso",description:"A cup",priceMinor:200,currency:"EUR" as const}]}]};
it("reuses explicit profile paint while keeping foreground readable on menu cards",async()=>{
 vi.mocked(getPublicMenu).mockResolvedValue(menu);const html=renderToStaticMarkup(await PublicMenuPage({params:{businessSlug:"example"}}));expect(html).toContain('background-color:#101827');expect(html).toContain('data-appearance="dark"');expect(html).toContain('background:color-mix(in srgb, #ffffff 100%, transparent)');expect(html).toMatch(/color:#172033[^>]*>Coffee/);expect(html).toMatch(/color:#172033[^>]*>Espresso/);expect(html).toContain('color:#f5f7fc');
});
it("photo blur and shading stay on separate background layers",async()=>{
 vi.mocked(getPublicMenu).mockResolvedValue({...menu,background:{...menu.background,backgroundImageUrl:"https://example.com/photo.jpg"},design:profileDesign.parse({...design,visual:{...design.visual,canvas:{background:"IMAGE",backgroundBlur:50,overlayOpacity:40,overlayColor:"#000000"}}})});const html=renderToStaticMarkup(await PublicMenuPage({params:{businessSlug:"example"}}));expect(html).toContain('filter:blur(10px)');expect(html).toContain('https://example.com/photo.jpg');expect(html).not.toMatch(/<main[^>]*filter:/);expect(html).toContain('color-mix(in srgb,#000000 40%,transparent)');
});
it("legacy menu keeps its original compatibility path",async()=>{
 vi.mocked(getPublicMenu).mockResolvedValue({...menu,theme:null,design:null});const html=renderToStaticMarkup(await PublicMenuPage({params:{businessSlug:"example"}}));expect(html).not.toContain('background-color:#101827');expect(html).toContain('text-slate-900');
});
