import type {CSSProperties} from "react";
import type {ProfileDesign} from "./profile-design";
import {resolveBackground,type BackgroundConfig,type ResolvedBackground} from "./background";

/** Resolve page paint once; explicit canvas settings never mix with legacy paint. */
export function resolveProfileBackground(profile:BackgroundConfig & {coverImageUrl?:string|null},design?:ProfileDesign):ResolvedBackground {
  const base=resolveBackground(profile),canvas=design?.visual?.canvas;
  if(design&&profile.backgroundMode==="DARK"){
    base.mode="dark";
    if(!profile.backgroundColor&&profile.backgroundType==="SOLID")base.style={backgroundColor:"#303644"};
  }
  const explicit=!!canvas?.background&&canvas.background!=="EXISTING";
  if(!explicit&&design?.backgroundPreset&&design.backgroundPreset!=="CUSTOM"){
    base.style={background:backgroundPresets[design.backgroundPreset]};
    base.mode=["DUSK","MIDNIGHT"].includes(design.backgroundPreset)?"dark":"light";base.hasImage=false;
  }
  if(canvas?.appearance)base.mode=canvas.appearance==="DARK"?"dark":"light";
  if(explicit){
    const color=canvas!.color??(base.mode==="dark"?"#101827":"#ffffff");
    const image=canvas!.imageSource==="COVER"?profile.coverImageUrl:profile.backgroundImageUrl;
    base.style={backgroundColor:color,backgroundImage:canvas!.background==="GRADIENT"?`linear-gradient(${canvas!.gradientAngle??135}deg,${color},${canvas!.gradientColor??"#dce5ef"})`:canvas!.background==="IMAGE"&&image?`url(${JSON.stringify(image)})`:"none",backgroundSize:(canvas!.imageFit??"COVER").toLowerCase(),backgroundPosition:`${canvas!.focalX??50}% ${canvas!.focalY??50}%`,backgroundRepeat:canvas!.repeat?"repeat":"no-repeat"};base.hasImage=false;
  }
  return base;
}
export const PROFILE_CANVAS_WIDTH=680;
/** Check known paint colors, never guessed photo pixels. */
export function backgroundTextContrast(design:ProfileDesign):{low:boolean;color:string}|null {
  const canvas=design.visual?.canvas;
  if(canvas?.background==="IMAGE")return null;
  const named=(!canvas?.background||canvas.background==="EXISTING")&&design.backgroundPreset&&design.backgroundPreset!=="CUSTOM"?backgroundPresets[design.backgroundPreset]:null;
  const colors=named?named.match(/#[0-9a-f]{6}/gi)??[]:canvas?.background==="GRADIENT"?[canvas.color??"#ffffff",canvas.gradientColor??"#dce5ef"]:canvas?.background==="SOLID"?[canvas.color??"#ffffff"]:[];
  if(!colors.length)return null;
  const luminance=(hex:string)=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  const ratio=(a:string,b:string)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const score=(text:string)=>Math.min(...colors.map(color=>ratio(text,color)));
  const light="#f5f7fc",dark="#172033",color=score(light)>score(dark)?light:dark,text=design.visual?.typography;
  return {low:[text?.name?.color,text?.heading?.color,text?.body?.color].filter((value):value is string=>!!value).some(value=>score(value)<4.5),color};
}
export function repairBackgroundTextContrast(design:ProfileDesign):ProfileDesign {
  const result=backgroundTextContrast(design);
  if(!result)return design;
  const visual=design.visual??{version:1 as const},typography={...visual.typography};
  for(const role of ["name","heading","body","caption"] as const)typography[role]={...typography[role],color:result.color};
  return {...design,visual:{...visual,typography}};
}
/** Flat paint keeps this setting dormant until a photo or layered recipe is used. */
export function supportsBackgroundBlur(design:ProfileDesign):boolean {
  const source=design.visual?.canvas?.background;
  return source==="IMAGE"||((!source||source==="EXISTING")&&!!design.backgroundPreset&&design.backgroundPreset!=="CUSTOM");
}
export function backgroundBlurRadius(design:ProfileDesign):number {
  const value=design.visual?.canvas?.backgroundBlur??0;
  return supportsBackgroundBlur(design)&&Number.isFinite(value)?Math.min(100,Math.max(0,value))/5:0;
}
export const backgroundPresets={
  DIFFUSION:"radial-gradient(ellipse at 15% 15%,#d9dfef,transparent 65%),linear-gradient(140deg,#f1eee9,#dbe7e6)",
  AURORA:"radial-gradient(ellipse at 15% 20%,#95b4bd,transparent 60%),radial-gradient(ellipse at 85% 75%,#b4a9ce,transparent 65%),linear-gradient(140deg,#e8edf0,#cbd7df)",
  PEARL:"radial-gradient(ellipse at 70% 10%,#fff9ed,transparent 65%),linear-gradient(150deg,#e8e4de,#d9e4e9)",
  DUSK:"radial-gradient(ellipse at 10% 10%,#817988,transparent 65%),linear-gradient(135deg,#263449,#3e5262)",
  MESH:"radial-gradient(at 10% 15%,#d2c5df,transparent 60%),radial-gradient(at 90% 20%,#b6d9d5,transparent 55%),radial-gradient(at 60% 90%,#e3d5c0,transparent 60%),#e9e9ed",
  MIDNIGHT:"radial-gradient(ellipse at 20% 10%,#394e69,transparent 65%),radial-gradient(ellipse at 85% 75%,#49425c,transparent 60%),#1c2633"
} as const;
export function profilePresentation(design:ProfileDesign,includeBackground=true):CSSProperties {
  const color=design.surfaceColor;
  const channels=color?[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4):null;
  const foreground=channels&&channels[0]*.2126+channels[1]*.7152+channels[2]*.0722<.179?"#f5f7fc":"#172033";
  const glass=design.theme==="LIQUID_GLASS"||design.surface==="GLASS";
  return {
    "--v2-canvas-width":PROFILE_CANVAS_WIDTH+"px",
    ...(includeBackground&&(!design.visual?.canvas?.background||design.visual.canvas.background==="EXISTING")&&design.backgroundPreset&&design.backgroundPreset!=="CUSTOM"?{background:backgroundPresets[design.backgroundPreset]}:{}),
    ...(color?{"--v2-surface-text":foreground,"--v2-surface":glass?`color-mix(in srgb,${color} 74%,transparent)`:color}:{}),
  } as CSSProperties;
}
