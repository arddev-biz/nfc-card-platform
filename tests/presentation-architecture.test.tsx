import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {it,expect} from "vitest";
import {SemanticIcon} from "@/components/profile/SemanticIcon";
import {iconSets} from "@/components/profile/SystemIcon";
import {semanticActions,resolveIconSemantic} from "@/lib/profile-icons";
import {profileDesign,reconcileDesign} from "@/lib/profile-design";
import {backgroundPresets,profilePresentation,PROFILE_CANVAS_WIDTH} from "@/lib/profile-presentation";
import {brandingCapabilities} from "@/lib/branding";
it("every supported semantic action resolves through every icon provider, including YouTube",()=>{
  for(const set of Object.keys(iconSets))for(const type of semanticActions){
    const html=renderToStaticMarkup(<SemanticIcon type={type} iconSet={set}/>);
    expect(html).toContain("<svg");expect(html).toContain(`data-icon-semantic="${type}"`);
  }
  expect(resolveIconSemantic("CUSTOM",null,"https://www.youtube.com/watch?v=123")).toBe("YOUTUBE");
  expect(resolveIconSemantic("CUSTOM",null,"https://youtu.be/123")).toBe("YOUTUBE");
  expect(resolveIconSemantic("CUSTOM",null,"https://youtube.com.evil.example/path")).toBe("CUSTOM");
  expect(renderToStaticMarkup(<SemanticIcon type="UNKNOWN" iconSet="UNKNOWN"/>)).toContain("<svg");
});
it("constrained presets and surface colors produce shared tokens, not arbitrary CSS",()=>{
  expect(PROFILE_CANVAS_WIDTH).toBeGreaterThanOrEqual(640);expect(PROFILE_CANVAS_WIDTH).toBeLessThanOrEqual(720);
  for(const backgroundPreset of Object.keys(backgroundPresets)){
    const design=profileDesign.parse({backgroundPreset,surfaceColor:"#223344",theme:"LIQUID_GLASS"});
    expect(profilePresentation(design)).toMatchObject({background:backgroundPresets[backgroundPreset as keyof typeof backgroundPresets],"--v2-surface":"color-mix(in srgb,#223344 74%,transparent)","--v2-surface-text":"#f5f7fc"});
  }
  expect(profileDesign.safeParse({surfaceColor:"url(evil)"}).success).toBe(false);
  expect(profileDesign.safeParse({backgroundPreset:"arbitrary-css"}).success).toBe(false);
});
it("design and footer saves reconcile independently instead of publishing or losing unrelated drafts",()=>{
  const before=profileDesign.parse({footer:{text:"Saved footer"}});
  const current={...before,surfaceColor:"#223344",footer:{hidden:false,text:"Unpublished footer"}};
  const styleSaved={...current,footer:before.footer};
  expect(reconcileDesign(current,before,current,styleSaved,"design")).toEqual(current);
  const footerSaved={...before,footer:current.footer};
  expect(reconcileDesign(current,before,current,footerSaved,"footer")).toEqual(current);
});
it("future client capability stays subscription-aware while unknown roles cannot customize",()=>{
  expect(brandingCapabilities("BUSINESS_OWNER",false).customizeFooter).toBe(false);
  expect(brandingCapabilities("BUSINESS_OWNER",true).customizeFooter).toBe(true);
  expect(brandingCapabilities("PUBLIC",true).customizeFooter).toBe(false);
});
