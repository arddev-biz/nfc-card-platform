export const socialBrands=["INSTAGRAM","FACEBOOK","TIKTOK","YOUTUBE","LINKEDIN","X","WHATSAPP"] as const;
export type SocialBrand=typeof socialBrands[number];
export const semanticActions=["WEBSITE","PHONE","EMAIL","WHATSAPP","LOCATION","GOOGLE_MAPS","GOOGLE_REVIEWS","MENU","SHARE","CUSTOM","INSTAGRAM","FACEBOOK","TIKTOK","YOUTUBE","LINKEDIN","X"] as const;
const hosts:Record<string,SocialBrand>={"youtube.com":"YOUTUBE","youtu.be":"YOUTUBE","linkedin.com":"LINKEDIN","twitter.com":"X","x.com":"X","instagram.com":"INSTAGRAM","facebook.com":"FACEBOOK","tiktok.com":"TIKTOK","wa.me":"WHATSAPP"};
export function resolveIconSemantic(type:string,network?:string|null,url?:string|null):string {
  if(network&&socialBrands.includes(network as SocialBrand))return network;
  if(type!=="CUSTOM")return type;
  try {const host=new URL(url||"").hostname.toLowerCase().replace(/^www\./,"");return hosts[host]??"CUSTOM";}catch{return "CUSTOM";}
}
