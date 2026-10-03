import type {ReactNode} from "react";
/** Optional presentation only; footer content and policy remain canonical. */
export function FooterDecoration({decoration,color,children}:{decoration?:string;color?:string;children:ReactNode}){
 const rules=decoration==="RULES"||decoration==="CURVED_RULES";
 if(!rules)return <>{decoration&&decoration!=="NONE"&&<div aria-hidden="true" className="mb-3">{({LINE:"—",HEART:"♥",STAR:"★"} as Record<string,string>)[decoration]}</div>}{children}</>;
 return <div className="visual-footer-decoration" data-curved={decoration==="CURVED_RULES"}>
  {decoration==="CURVED_RULES"&&<svg aria-hidden="true" className="visual-footer-curve" viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M0 12 C100 12 155 70 250 32 S350 -2 400 14 V120 H0Z" fill={color??"#171719"}/><path d="M0 12 C100 12 155 70 250 32 S350 -2 400 14" fill="none" stroke="currentColor" strokeOpacity=".25"/></svg>}
  <div className="visual-footer-rules"><span aria-hidden="true"/><span>{children}</span><span aria-hidden="true"/></div>
 </div>;
}
