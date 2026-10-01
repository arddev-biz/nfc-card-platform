import type {ProfileVisual} from '@/lib/profile-visual';
import {surfaceCSS} from '@/lib/profile-visual';
export function ThemeThumbnail({visual}:{visual:ProfileVisual}){
  const c=visual.canvas??{},h=visual.hero??{},cover=["COVER_OVERLAP","IMAGE_HERO","PORTRAIT"].includes(h.composition??"");
  return <span aria-hidden="true" className="builder-v3-theme-preview" data-composition={h.composition} style={{background:c.background==="GRADIENT"?`linear-gradient(${c.gradientAngle??135}deg,${c.color},${c.gradientColor})`:c.color,color:visual.typography?.body?.color,alignItems:h.align==="LEFT"?"flex-start":"center"}}>
    {cover&&<span className="builder-v3-theme-cover" style={{background:h.composition==="IMAGE_HERO"?"#29404c":"#9a8c7366"}}/>}
    <span className="builder-v3-theme-avatar" style={{width:(h.avatarSize??96)/6,height:(h.avatarSize??96)/6,borderRadius:(h.avatarRadius??48)/6,marginTop:cover?8:0,border:`1px solid ${h.avatarBorderColor??"currentColor"}`}}/>
    <span className="builder-v3-theme-line" style={{width:h.align==="LEFT"?42:35}}/>
    <span className="builder-v3-theme-action" style={{...surfaceCSS({...visual.surface,...visual.primaryAction?.surface}),height:(visual.primaryAction?.action?.minHeight??visual.action?.minHeight??56)/5,borderRadius:(visual.primaryAction?.surface?.radius??visual.surface?.radius??12)/3}}/>
    <span className="builder-v3-theme-action" style={{...surfaceCSS(visual.surface),height:(visual.primaryAction?.action?.minHeight??visual.action?.minHeight??56)/5,borderRadius:(visual.surface?.radius??12)/3}}/>
  </span>;
}
