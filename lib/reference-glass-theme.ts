import { profileDesign, footerConfig } from "./profile-design";
import { socialConfig, parseSectionConfig } from "./profile-v2";
import { snapshotCurrentDesign } from "./custom-themes";

/** Content-free starting design: photos, identity and links come from the business. */
export const referenceGlassDesign = profileDesign.parse({
  theme: "CLASSIC", iconColor: "BRAND", hoverStyle: "SOFT_LIFT", density: "COMFORTABLE",
  visual: {
    version: 1,
    canvas: { background: "SOLID", color: "#08090a",
      appearance: "DARK", maxWidth: 480, padding: 18, gap: 28 },
    hero: { composition: "IMAGE_HERO", identityPosition: "OVER_IMAGE", align: "CENTER",
      height: 360, mobileHeight: 360, focalX: 50, focalY: 50, overlayColor: "#000000",
      overlayOpacity: 4, fade: 65, avatarSize: 112, avatarRadius: 56, avatarBorder: 1,
      avatarBorderColor: "#e3d9c9", avatarBackground: "#121010", avatarShadow: "NONE",
      padding: 24, paddingBottom: 28, gap: 10 },
    surface: { variant: "GLASS", color: "#302d2e", opacity: 72, gradientColor: "#111214",
      gradientAngle: 145, borderColor: "#6a5e53", borderWidth: 1, radius: 22, blur: 6, shadow: "SOFT" },
    action: { minHeight: 70, padding: 12, iconSize: 28, iconPosition: "LEFT",
      iconContainerSize: 44, iconRadius: 14, iconBackground: "#29282b", textColor: "#ffffff", chevron: true,
      chevronSize:24,chevronColor:"#b4b0ad",brandArtwork:true },
    typography: {
      name: { font: "SANS", size: 32, weight: "700", color: "#ffffff", lineHeight: 1.2 },
      label: { font: "SANS", size: 19, weight: "600", color: "#ffffff", lineHeight: 1.35 },
      heading: { font: "SANS", size: 20, weight: "600", color: "#ffffff" },
      body: { font: "SANS", size: 16, color: "#eeeeee" },
      caption: { font: "SANS", size: 16, color: "#b9b7b6", lineHeight: 1.4 },
    },
    socials: {
      surface: { variant: "GLASS", color: "#333033", opacity: 65, gradientColor:"#17181a",gradientAngle:145,borderColor: "#776d64",
        borderWidth: 1, radius: 48, blur: 5, shadow: "SOFT" },
      action: { minHeight: 48, padding: 8, iconSize: 26, iconContainerSize: 30,brandArtwork:true },
    },
  },
});
export const referenceGlassSocialConfig = socialConfig.parse({
  composition: "ICONS", labels: false, align: "CENTER", iconColor: "BRAND", containerStyle: "ICON_ONLY",
  visual: { layout: { gap: 16, before: 12 } }, surface: { preset: "NONE" },
});
export const referenceGlassLinksConfig = parseSectionConfig("LINKS",{
  surface: { preset: "NONE" }, visual: { layout: { gap: 12 } },
});
export const referenceGlassFooter = footerConfig.parse({
  hidden: false, text: "", visual: {
    decoration: "CURVED_RULES", layout: { before: 12, padding: 0 },
    text: { size: 12, tracking: 2.4, color: "#9ca0a4", align: "CENTER" },
  },
});
export const referenceGlassSnapshot = snapshotCurrentDesign({...referenceGlassDesign,footer:referenceGlassFooter}, null,[
 {singletonKey:"SOCIALS",config:referenceGlassSocialConfig},
 {singletonKey:"LINKS",config:referenceGlassLinksConfig},
]);
