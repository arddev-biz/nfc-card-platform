import {SiInstagram} from "@react-icons/all-files/si/SiInstagram";
import {SiFacebook} from "@react-icons/all-files/si/SiFacebook";
import {SiTiktok} from "@react-icons/all-files/si/SiTiktok";
import {SiYoutube} from "@react-icons/all-files/si/SiYoutube";
import {SiLinkedin} from "@react-icons/all-files/si/SiLinkedin";
import {SiWhatsapp} from "@react-icons/all-files/si/SiWhatsapp";
import {SiPinterest} from "@react-icons/all-files/si/SiPinterest";
import {SiTwitch} from "@react-icons/all-files/si/SiTwitch";
import {SiSnapchat} from "@react-icons/all-files/si/SiSnapchat";
import {SiSpotify} from "@react-icons/all-files/si/SiSpotify";
import {SiDiscord} from "@react-icons/all-files/si/SiDiscord";
import {SiTelegram} from "@react-icons/all-files/si/SiTelegram";
import {SiReddit} from "@react-icons/all-files/si/SiReddit";
import {SiGithub} from "@react-icons/all-files/si/SiGithub";
import {SiBehance} from "@react-icons/all-files/si/SiBehance";
import {SiDribbble} from "@react-icons/all-files/si/SiDribbble";
import {SiVimeo} from "@react-icons/all-files/si/SiVimeo";
import {SiSoundcloud} from "@react-icons/all-files/si/SiSoundcloud";
import {SystemIcon,type SystemGlyph} from "./SystemIcon";
import type {CSSProperties} from "react";
import {useId} from "react";
import {resolveIconSemantic,socialBrandPalette} from "@/lib/profile-icons";
const brands={INSTAGRAM:{Icon:SiInstagram,color:"#C13584"},FACEBOOK:{Icon:SiFacebook,color:"#1877F2"},TIKTOK:{Icon:SiTiktok,color:"currentColor"},YOUTUBE:{Icon:SiYoutube,color:"#FF0000"},LINKEDIN:{Icon:SiLinkedin,color:"#0A66C2"},WHATSAPP:{Icon:SiWhatsapp,color:"#25D366"},PINTEREST:{Icon:SiPinterest,color:socialBrandPalette.PINTEREST.background},TWITCH:{Icon:SiTwitch,color:socialBrandPalette.TWITCH.background},SNAPCHAT:{Icon:SiSnapchat,color:socialBrandPalette.SNAPCHAT.background},SPOTIFY:{Icon:SiSpotify,color:socialBrandPalette.SPOTIFY.background},DISCORD:{Icon:SiDiscord,color:socialBrandPalette.DISCORD.background},TELEGRAM:{Icon:SiTelegram,color:socialBrandPalette.TELEGRAM.background},REDDIT:{Icon:SiReddit,color:socialBrandPalette.REDDIT.background},GITHUB:{Icon:SiGithub,color:socialBrandPalette.GITHUB.background},BEHANCE:{Icon:SiBehance,color:socialBrandPalette.BEHANCE.background},DRIBBBLE:{Icon:SiDribbble,color:socialBrandPalette.DRIBBBLE.background},VIMEO:{Icon:SiVimeo,color:socialBrandPalette.VIMEO.background},SOUNDCLOUD:{Icon:SiSoundcloud,color:socialBrandPalette.SOUNDCLOUD.background}};
const glyphs:Record<string,SystemGlyph>={PHONE:"PHONE",EMAIL:"EMAIL",WEBSITE:"WEBSITE",LOCATION:"LOCATION",GOOGLE_MAPS:"DIRECTIONS",GOOGLE_REVIEWS:"REVIEW",MENU:"MENU",SHARE:"SHARE",CUSTOM:"LINK"};
export function SemanticIcon({type,network,destination,size=24,iconSet,iconStyle,iconColor,brandArtwork=false}:{type:string;network?:string|null;destination?:string|null;size?:number;iconSet?:string;iconStyle?:string;iconColor?:string;brandArtwork?:boolean}) {
  const gradientId=useId().replace(/:/g,"");
  const semantic=resolveIconSemantic(type,network,destination);
  const brand=Object.prototype.hasOwnProperty.call(brands,semantic)?brands[semantic as keyof typeof brands]:null;
  if(brandArtwork&&iconColor==="BRAND"&&semantic==="FACEBOOK")return <span aria-hidden="true" data-icon-semantic={semantic} data-icon-artwork="BRAND" className="inline-flex shrink-0 overflow-hidden rounded-full" style={{width:size,height:size,background:"#fff",color:"#1877f2"}}><SiFacebook size={size}/></span>;
  if(brandArtwork&&iconColor==="BRAND"&&semantic==="YOUTUBE")return <span aria-hidden="true" data-icon-semantic={semantic} data-icon-artwork="BRAND" style={{display:"inline-flex",width:size,height:size}}><svg viewBox="0 0 24 24" className="h-full w-full"><rect x="1" y="4" width="22" height="16" rx="5" fill="#ff0000"/><path d="m10 8 7 4-7 4Z" fill="#fff"/></svg></span>;
  if(brandArtwork&&iconColor==="BRAND"&&(semantic==="INSTAGRAM"||semantic==="TIKTOK"))return <span aria-hidden="true" data-icon-semantic={semantic} data-icon-artwork="BRAND" className="inline-flex shrink-0 items-center justify-center" style={{width:size,height:size}}>
    {semantic==="INSTAGRAM"?<svg viewBox="0 0 24 24" fill="none" className="h-full w-full"><defs><linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0"><stop stopColor="#ffd776"/><stop offset=".3" stopColor="#f84652"/><stop offset=".65" stopColor="#d02bd0"/><stop offset="1" stopColor="#7638fa"/></linearGradient></defs><g data-brand-stroke stroke={`url(#${gradientId})`} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill={`url(#${gradientId})`} stroke="none"/></g></svg>:<svg viewBox="-1 -1 26 26" className="h-full w-full"><g transform="translate(-.7,-.35)" style={{color:"#25f4ee"}}><SiTiktok size={24}/></g><g transform="translate(.7,.35)" style={{color:"#fe2c55"}}><SiTiktok size={24}/></g><g style={{color:"#fff"}}><SiTiktok size={24}/></g></svg>}
  </span>;
  return <span aria-hidden="true" data-icon-semantic={semantic} className={`inline-flex shrink-0 items-center justify-center ${brand||semantic==="X"?"":"v2-system-icon"}`} style={{"--social-brand-ink":semantic==="TIKTOK"||semantic==="X"?"#000000":brand?.color,width:size,height:size,color:iconColor==="THEME"?"var(--v2-accent)":iconColor==="BRAND"&&brand?brand.color:undefined} as CSSProperties}>
    {brand?<brand.Icon className="h-full w-full"/>:semantic==="X"?<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.4L6.3 22H3.1l7.3-8.4L1 2h6.4l4.4 5.8L18.9 2ZM17.8 20h1.7L6.5 4H4.7Z"/></svg>:<SystemIcon set={iconSet} style={iconStyle} glyph={glyphs[semantic]??"LINK"} className="h-full w-full"/>}
  </span>;
}
