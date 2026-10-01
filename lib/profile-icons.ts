export const socialBrands=["INSTAGRAM","FACEBOOK","TIKTOK","YOUTUBE","LINKEDIN","X","WHATSAPP","PINTEREST","TWITCH","SNAPCHAT","SPOTIFY","DISCORD","TELEGRAM","REDDIT","GITHUB","BEHANCE","DRIBBBLE","VIMEO","SOUNDCLOUD"] as const;
export type SocialBrand=typeof socialBrands[number];
export function isLightSocialFill(value:string):boolean {
 let rgb:number[]|undefined;
 if(/^#[0-9a-f]{6}$/i.test(value))rgb=[1,3,5].map(offset=>parseInt(value.slice(offset,offset+2),16)/255);
 else if(value.startsWith("color(srgb"))rgb=(value.match(/[\d.]+/g)??[]).slice(0,3).map(Number);
 else if(/^rgba?\(/.test(value))rgb=(value.match(/[\d.]+/g)??[]).slice(0,3).map(v=>Number(v)/255);
 if(!rgb||rgb.length!==3||rgb.some(n=>!Number.isFinite(n)))return false;
 const linear=rgb.map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
 return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722>=.55;
}
export const socialBrandPalette:Record<SocialBrand,{background:string;foreground:string}>={
 INSTAGRAM:{background:"#E1306C",foreground:"#FFFFFF"},FACEBOOK:{background:"#1877F2",foreground:"#FFFFFF"},
 TIKTOK:{background:"#000000",foreground:"#FFFFFF"},YOUTUBE:{background:"#FF0000",foreground:"#FFFFFF"},
 LINKEDIN:{background:"#0A66C2",foreground:"#FFFFFF"},X:{background:"#000000",foreground:"#FFFFFF"},
 WHATSAPP:{background:"#25D366",foreground:"#000000"},PINTEREST:{background:"#E60023",foreground:"#FFFFFF"},
 TWITCH:{background:"#9146FF",foreground:"#FFFFFF"},SNAPCHAT:{background:"#FFFC00",foreground:"#000000"},
 SPOTIFY:{background:"#1DB954",foreground:"#000000"},DISCORD:{background:"#5865F2",foreground:"#FFFFFF"},
 TELEGRAM:{background:"#0088CC",foreground:"#FFFFFF"},REDDIT:{background:"#FF4500",foreground:"#FFFFFF"},
 GITHUB:{background:"#181717",foreground:"#FFFFFF"},BEHANCE:{background:"#1769FF",foreground:"#FFFFFF"},
 DRIBBBLE:{background:"#EA4C89",foreground:"#FFFFFF"},VIMEO:{background:"#1AB7EA",foreground:"#000000"},
 SOUNDCLOUD:{background:"#FF5500",foreground:"#FFFFFF"},
};
export const semanticActions=["WEBSITE","PHONE","EMAIL","WHATSAPP","LOCATION","GOOGLE_MAPS","GOOGLE_REVIEWS","MENU","SHARE","CUSTOM","INSTAGRAM","FACEBOOK","TIKTOK","YOUTUBE","LINKEDIN","X"] as const;
const hosts:Record<string,SocialBrand>={"youtube.com":"YOUTUBE","youtu.be":"YOUTUBE","linkedin.com":"LINKEDIN","twitter.com":"X","x.com":"X","instagram.com":"INSTAGRAM","facebook.com":"FACEBOOK","tiktok.com":"TIKTOK","wa.me":"WHATSAPP","pinterest.com":"PINTEREST","pin.it":"PINTEREST","twitch.tv":"TWITCH","snapchat.com":"SNAPCHAT","spotify.com":"SPOTIFY","open.spotify.com":"SPOTIFY","discord.com":"DISCORD","discord.gg":"DISCORD","t.me":"TELEGRAM","telegram.me":"TELEGRAM","reddit.com":"REDDIT","github.com":"GITHUB","behance.net":"BEHANCE","dribbble.com":"DRIBBBLE","vimeo.com":"VIMEO","soundcloud.com":"SOUNDCLOUD"};
export function resolveIconSemantic(type:string,network?:string|null,url?:string|null):string {
  if(network&&socialBrands.includes(network as SocialBrand))return network;
  if(type!=="CUSTOM")return type;
  try {const host=new URL(url||"").hostname.toLowerCase().replace(/^www\./,"");return hosts[host]??"CUSTOM";}catch{return "CUSTOM";}
}
