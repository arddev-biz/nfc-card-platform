import type {CSSProperties} from "react";
import type {ProfileDesign} from "./profile-design";
export const PROFILE_CANVAS_WIDTH=680;
export const backgroundPresets={
  DIFFUSION:"radial-gradient(ellipse at 15% 15%,#d9dfef,transparent 65%),linear-gradient(140deg,#f1eee9,#dbe7e6)",
  AURORA:"radial-gradient(ellipse at 15% 20%,#95b4bd,transparent 60%),radial-gradient(ellipse at 85% 75%,#b4a9ce,transparent 65%),linear-gradient(140deg,#e8edf0,#cbd7df)",
  PEARL:"radial-gradient(ellipse at 70% 10%,#fff9ed,transparent 65%),linear-gradient(150deg,#e8e4de,#d9e4e9)",
  DUSK:"radial-gradient(ellipse at 10% 10%,#817988,transparent 65%),linear-gradient(135deg,#263449,#3e5262)",
  MESH:"radial-gradient(at 10% 15%,#d2c5df,transparent 60%),radial-gradient(at 90% 20%,#b6d9d5,transparent 55%),radial-gradient(at 60% 90%,#e3d5c0,transparent 60%),#e9e9ed",
  MIDNIGHT:"radial-gradient(ellipse at 20% 10%,#394e69,transparent 65%),radial-gradient(ellipse at 85% 75%,#49425c,transparent 60%),#1c2633"
} as const;
export function profilePresentation(design:ProfileDesign):CSSProperties {
  const color=design.surfaceColor;
  const channels=color?[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4):null;
  const foreground=channels&&channels[0]*.2126+channels[1]*.7152+channels[2]*.0722<.179?"#f5f7fc":"#172033";
  const glass=design.theme==="LIQUID_GLASS"||design.surface==="GLASS";
  return {
    "--v2-canvas-width":PROFILE_CANVAS_WIDTH+"px",
    ...(design.backgroundPreset&&design.backgroundPreset!=="CUSTOM"?{background:backgroundPresets[design.backgroundPreset]}:{}),
    ...(color?{"--v2-surface-text":foreground,"--v2-surface":glass?`color-mix(in srgb,${color} 74%,transparent)`:color}:{}),
  } as CSSProperties;
}
