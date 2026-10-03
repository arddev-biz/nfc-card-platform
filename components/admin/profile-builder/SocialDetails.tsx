"use client";
import type {VisualOverride} from "@/lib/profile-visual";
import {Field,Toggle} from "./V2Controls";
import {ExactNumber,VisualChoice} from "./VisualFields";
import {PresetNumber} from "./PrecisionControls";

export function SocialDetails({value,onChange,showSize=true}:{showSize?:boolean;value:VisualOverride;onChange:(next:VisualOverride)=>void}){
 const s=value.surface??{},a=value.action??{};
 const surface=(next:Partial<typeof s>)=>onChange({surface:next});
 const action=(next:Partial<typeof a>)=>onChange({action:next});
 return <div className="space-y-4">
  {showSize&&<PresetNumber label="Social button size" value={a.minHeight??48} min={44} max={160} presets={[{value:44,label:"Small"},{value:48,label:"Medium"},{value:60,label:"Large"}]} onChange={minHeight=>action({minHeight})}/>}
  <details><summary className="cursor-pointer text-sm font-medium">Advanced outer button style</summary><div className="space-y-3 pt-3">
   {s.variant!=="TRANSPARENT"&&<Toggle label="Two-color outer button" value={!!s.gradientColor} onChange={enabled=>surface({gradientColor:enabled?"#17181a":undefined})}/>}{s.variant!=="TRANSPARENT"&&s.gradientColor&&<><Field type="color" label="Second outer button color" value={s.gradientColor} onChange={gradientColor=>surface({gradientColor})}/><ExactNumber label="Outer button fill direction" value={s.gradientAngle??135} max={360} onChange={gradientAngle=>surface({gradientAngle})}/></>}
   <ExactNumber label="Outer border thickness" value={s.borderWidth??1} max={4} onChange={borderWidth=>surface({borderWidth})}/><PresetNumber label="Outer button shape" value={s.radius??48} max={48} presets={[{value:0,label:"Square"},{value:16,label:"Rounded"},{value:48,label:"Circle"}]} onChange={radius=>surface({radius})}/>
   <ExactNumber label="Button padding" value={a.padding??8} min={8} max={32} onChange={padding=>action({padding})}/><ExactNumber label="Icon tile size" value={a.iconContainerSize??30} min={24} max={72} onChange={iconContainerSize=>action({iconContainerSize})}/>
  </div></details>
 </div>;
}
