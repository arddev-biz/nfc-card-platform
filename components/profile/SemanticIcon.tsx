import {SiInstagram} from "@react-icons/all-files/si/SiInstagram";
import {SiFacebook} from "@react-icons/all-files/si/SiFacebook";
import {SiTiktok} from "@react-icons/all-files/si/SiTiktok";
import {SiYoutube} from "@react-icons/all-files/si/SiYoutube";
import {SiLinkedin} from "@react-icons/all-files/si/SiLinkedin";
import {SiWhatsapp} from "@react-icons/all-files/si/SiWhatsapp";
import {SystemIcon,type SystemGlyph} from "./SystemIcon";
import {resolveIconSemantic} from "@/lib/profile-icons";
const brands={INSTAGRAM:{Icon:SiInstagram,color:"#C13584"},FACEBOOK:{Icon:SiFacebook,color:"#1877F2"},TIKTOK:{Icon:SiTiktok,color:"currentColor"},YOUTUBE:{Icon:SiYoutube,color:"#FF0000"},LINKEDIN:{Icon:SiLinkedin,color:"#0A66C2"},WHATSAPP:{Icon:SiWhatsapp,color:"#25D366"}};
const glyphs:Record<string,SystemGlyph>={PHONE:"PHONE",EMAIL:"EMAIL",WEBSITE:"WEBSITE",LOCATION:"LOCATION",GOOGLE_MAPS:"DIRECTIONS",GOOGLE_REVIEWS:"REVIEW",MENU:"MENU",SHARE:"SHARE",CUSTOM:"LINK"};
export function SemanticIcon({type,network,destination,size=24,iconSet,iconStyle,iconColor}:{type:string;network?:string|null;destination?:string|null;size?:number;iconSet?:string;iconStyle?:string;iconColor?:string}) {
  const semantic=resolveIconSemantic(type,network,destination);
  const brand=Object.prototype.hasOwnProperty.call(brands,semantic)?brands[semantic as keyof typeof brands]:null;
  return <span aria-hidden="true" data-icon-semantic={semantic} className={`inline-flex shrink-0 items-center justify-center ${brand||semantic==="X"?"":"v2-system-icon"}`} style={{width:size,height:size,color:iconColor==="THEME"?"var(--v2-accent)":iconColor==="BRAND"&&brand?brand.color:undefined}}>
    {brand?<brand.Icon className="h-full w-full"/>:semantic==="X"?<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.4L6.3 22H3.1l7.3-8.4L1 2h6.4l4.4 5.8L18.9 2ZM17.8 20h1.7L6.5 4H4.7Z"/></svg>:<SystemIcon set={iconSet} style={iconStyle} glyph={glyphs[semantic]??"LINK"} className="h-full w-full"/>}
  </span>;
}
