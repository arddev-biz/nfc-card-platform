import {backgroundPresets} from "./profile-presentation";
import type {ProfileDesign} from "./profile-design";
import type {ProfileVisual} from "./profile-visual";
type Canvas=NonNullable<ProfileVisual["canvas"]>;
type Named=Exclude<NonNullable<ProfileDesign["backgroundPreset"]>,"CUSTOM">;
export type BackgroundRecipe={name:string;named?:Named;canvas?:Canvas;preview:string};
const simple=(name:string,color:string,gradientColor:string,appearance:Canvas["appearance"]="LIGHT"):BackgroundRecipe=>({name,canvas:{background:"GRADIENT",color,gradientColor,gradientAngle:135,appearance,overlayOpacity:0},preview:`linear-gradient(135deg,${color},${gradientColor})`});
export const backgroundRecipes:BackgroundRecipe[]=[
 ...(["AURORA","PEARL","DUSK","MIDNIGHT","MESH","DIFFUSION"] as Named[]).map(named=>({name:named[0]+named.slice(1).toLowerCase(),named,preview:backgroundPresets[named]})),
 simple("Sunset","#f97316","#ec4899"),simple("Ocean","#2563eb","#0d9488"),simple("Forest","#14532d","#a7c4a0"),simple("Ember","#9a3412","#fbbf24"),
 simple("Lavender","#c4b5fd","#ede9fe"),simple("Arctic","#dbeafe","#ffffff"),simple("Neon Mist","#a7f3d0","#ddd6fe"),simple("Sand","#d6c4a5","#fff7e6"),
 simple("Rose","#f9a8d4","#fff1f2"),simple("Slate","#334155","#64748b","DARK"),simple("Cosmic","#312e81","#7c3aed","DARK"),simple("Lime Glow","#bef264","#166534"),simple("Peach","#fdba74","#fff7ed"),simple("Mono","#e5e7eb","#ffffff"),
];
export function applyBackgroundRecipe(design:ProfileDesign,recipe:BackgroundRecipe):ProfileDesign{
 const canvas=design.visual?.canvas??{};
 return {...design,backgroundPreset:recipe.named,visual:{...design.visual,version:1,canvas:recipe.named?{...canvas,background:"EXISTING",appearance:recipe.named==="DUSK"||recipe.named==="MIDNIGHT"?"DARK":"LIGHT",overlayOpacity:0}:{...canvas,...recipe.canvas}}};
}
