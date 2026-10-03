import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { VisualHeader } from "@/components/profile/VisualHeader";
import {SemanticIcon} from "@/components/profile/SemanticIcon";
import {VisualAction} from "@/components/profile/VisualAction";
import {FooterDecoration} from "@/components/profile/FooterDecoration";
import {FooterVisualControls} from "@/components/admin/profile-builder/VisualControls";
import {EssentialDesignEditor} from "@/components/admin/profile-builder/EssentialDesignEditor";
import { heroDesign } from "@/lib/profile-visual";
import { referenceGlassDesign, referenceGlassSnapshot, referenceGlassFooter, referenceGlassSocialConfig } from "@/lib/reference-glass-theme";
import { profileDesign } from "@/lib/profile-design";
import { socialConfig } from "@/lib/profile-v2";
import { applyCustomTheme } from "@/lib/custom-themes";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";

it("keeps missing fade and avatar background unchanged and validates bounds", () => {
  expect(heroDesign.parse({padding:20})).toEqual({padding:20});
  expect(heroDesign.safeParse({fade:101}).success).toBe(false);
  expect(heroDesign.safeParse({fade:-1}).success).toBe(false);
});
it("validates the complete footer and social configuration without resetting the visual design",()=>{
 expect(profileDesign.safeParse({...referenceGlassDesign,footer:referenceGlassFooter}).success).toBe(true);
 expect(socialConfig.safeParse(referenceGlassSocialConfig).success).toBe(true);
});
it("snapshots reusable header treatment without business content", () => {
  expect(referenceGlassSnapshot.visual.hero).toMatchObject({fade:65,avatarBackground:"#121010"});
  expect(JSON.stringify(referenceGlassSnapshot)).not.toMatch(/Mulliri|coverImageUrl|logoUrl|sectionId/);
  expect(applyCustomTheme(referenceGlassDesign,referenceGlassSnapshot).visual?.hero?.fade).toBe(65);
});
it("fades the cover layer only and leaves identity sharp", () => {
  const business={name:"Example",profile:{displayName:"Example",coverImageUrl:"https://example.com/cover.png",
    logoUrl:"https://example.com/logo.png",isVerified:false}} as PublicBusinessProfile;
  const html=renderToStaticMarkup(<VisualHeader business={business} design={referenceGlassDesign.visual!}/>);
  expect(html).toContain("mask-image:linear-gradient(to bottom, #000 35%, transparent 93.5%, transparent 100%)");
  expect(html).toContain("background:#121010");
  expect(html).not.toContain("filter:blur");
});
it("leaves the cover unmasked when fade is absent or zero",()=>{
 const business={name:"Example",profile:{displayName:"Example",coverImageUrl:"https://example.com/cover.png",isVerified:false}} as PublicBusinessProfile;
 for(const fade of [undefined,0])expect(renderToStaticMarkup(<VisualHeader business={business} design={{version:1,hero:{fade}}}/>)).not.toContain("mask-image");
});
it("uses opt-in multicolor brand artwork and preserves monochrome fallback",()=>{
 const instagram=renderToStaticMarkup(<SemanticIcon type="SOCIAL" network="INSTAGRAM" iconColor="BRAND" brandArtwork/>);
 expect(instagram).toContain("linearGradient");expect(instagram).toContain('data-icon-artwork="BRAND"');
 const tiktok=renderToStaticMarkup(<SemanticIcon type="SOCIAL" network="TIKTOK" iconColor="BRAND" brandArtwork/>);
 expect(tiktok).toContain("#25f4ee");expect(tiktok).toContain("#fe2c55");
 expect(renderToStaticMarkup(<SemanticIcon type="SOCIAL" network="INSTAGRAM" iconColor="MONOCHROME" brandArtwork/>)).not.toContain("linearGradient");
 expect(renderToStaticMarkup(<SemanticIcon type="SOCIAL" network="INSTAGRAM" iconColor="BRAND"/>)).not.toContain("linearGradient");
});
it("renders a shared configurable SVG chevron without changing link ownership",()=>{
 const html=renderToStaticMarkup(<VisualAction href="/example" label="Example" icon={null} visual={{action:{chevron:true,chevronSize:24,chevronColor:"#b4b0ad"}}}/>);
 expect(html).toContain('width="24"');expect(html).toContain('color:#b4b0ad');expect(html).not.toContain("›");
 expect(renderToStaticMarkup(<VisualAction href="/example" label="Example" icon={null} visual={{action:{chevron:false}}}/>)).not.toContain("<svg");
});
it("snapshots footer appearance only and keeps footer content when applying",()=>{
 expect(referenceGlassSnapshot.footerVisual?.decoration).toBe("CURVED_RULES");
 const current=profileDesign.parse({...referenceGlassDesign,footer:{text:"Keep my branding",hidden:true}});
 const applied=applyCustomTheme(current,referenceGlassSnapshot);
 expect(applied.footer).toMatchObject({text:"Keep my branding",hidden:true,visual:{decoration:"CURVED_RULES"}});
 const html=renderToStaticMarkup(<FooterDecoration decoration="CURVED_RULES">Example</FooterDecoration>);
 expect(html).toContain('class="visual-footer-rules"');expect(html).toContain("visual-footer-curve");
 expect(renderToStaticMarkup(<FooterDecoration>Example</FooterDecoration>)).toBe("Example");
});
it("exposes reusable footer controls without losing configured typography",()=>{
 const html=renderToStaticMarkup(<FooterVisualControls value={referenceGlassFooter.visual!} onChange={()=>{}}/>);
 expect(html).toContain("Curved surface with side lines");expect(html).toContain("Curved surface color");
 expect(html).toContain('value="12"');expect(html).toContain('#9ca0a4');
});
it("exposes global artwork and arrow controls in the existing design editor",()=>{
 const html=renderToStaticMarkup(<EssentialDesignEditor design={referenceGlassDesign} onChange={()=>{}} organizationId="example" backgroundUrl={null} coverUrl={null} onBackgroundChange={()=>{}} accent="#ffffff" onAccentChange={()=>{}}/>);
 expect(html).toContain("Multicolor brand artwork");expect(html).toContain("Arrow size");expect(html).toContain("Arrow color");
 expect(html).not.toContain("Save Changes");
});
