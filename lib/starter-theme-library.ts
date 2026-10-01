// Stable library identities bridge legacy preset names without rewriting profiles.
// Definitions remain in profile-presets solely for compatibility/materialization.
export const starterThemeLibrary=[
 {name:"Modern Minimal",id:"cmuoh000000000000000000001"},
 {name:"Premium Glass",id:"cmuoh000000000000000000002"},
 {name:"Warm Business",id:"cmuoh000000000000000000003"},
 {name:"Dark Premium",id:"cmuoh000000000000000000004"},
 {name:"Bold Creator",id:"cmuoh000000000000000000005"},
 {name:"Clean Professional",id:"cmuoh000000000000000000006"},
] as const;
export function starterThemeId(name?:string|null){return starterThemeLibrary.find(theme=>theme.name===name)?.id}
export function libraryThemeOrder(id:string){const index=starterThemeLibrary.findIndex(theme=>theme.id===id);return index<0?starterThemeLibrary.length:index}
