"use client";
import {Children,useEffect,useRef,useState,type CSSProperties,type ReactNode} from "react";

/** One accessible copy of each link; automatic motion yields to direct interaction. */
export function SocialIconRow({children,gap,align}:{children:ReactNode;gap:number;align:"LEFT"|"CENTER"|"RIGHT"}){
 const track=useRef<HTMLDivElement>(null),pauseUntil=useRef(0),hovered=useRef(false),focused=useRef(false);
 const drag=useRef<{x:number;y:number;left:number;moved:boolean}|null>(null),suppressUntil=useRef(0);
 const [fourWidth,setFourWidth]=useState<number>(),[overflow,setOverflow]=useState(false);
 const count=Children.count(children);
 useEffect(()=>{
  const el=track.current;if(!el)return;
  const measure=()=>{
   const items=[...el.children].slice(0,4);
   setFourWidth(count>4?items.reduce((sum,item)=>sum+item.getBoundingClientRect().width,0)+gap*3:undefined);
   setOverflow(count>4||el.scrollWidth>el.clientWidth+1);
  };
  measure();const observer=new ResizeObserver(measure);observer.observe(el);
  [...el.children].forEach(child=>observer.observe(child));
  return()=>observer.disconnect();
 },[count,gap]);
 useEffect(()=>{
  const el=track.current;if(!el||!overflow)return;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame=0,previous=0,direction=1,remainder=0,visible=true;
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(el);
  function tick(now:number){
   const delta=previous?Math.min(now-previous,64):0;previous=now;
   const max=el!.scrollWidth-el!.clientWidth;
   if(!motion.matches&&visible&&!document.hidden&&!hovered.current&&!focused.current&&!drag.current&&now>=pauseUntil.current&&max>1){
    if(el!.scrollLeft>=max-1)direction=-1;else if(el!.scrollLeft<=0)direction=1;
    remainder+=delta*.018;
    if(remainder>=1){const pixels=Math.floor(remainder);el!.scrollLeft+=direction*pixels;remainder-=pixels;}
   }
   frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[overflow]);
 const pause=()=>{pauseUntil.current=performance.now()+3000;};
 const finish=(event?:{currentTarget:HTMLDivElement})=>{if(drag.current?.moved){suppressUntil.current=performance.now()+350;if(event)event.currentTarget.dataset.socialDragUntil=String(suppressUntil.current);}drag.current=null;pause();};
 const style:CSSProperties={gap,maxWidth:fourWidth,width:"100%",marginLeft:align==="RIGHT"||align==="CENTER"?"auto":undefined,marginRight:align==="LEFT"||align==="CENTER"?"auto":undefined,justifyContent:overflow?"flex-start":{LEFT:"flex-start",CENTER:"center",RIGHT:"flex-end"}[align],touchAction:"pan-y"};
 return <div ref={track} className="social-icon-row" style={style} role={overflow?"region":undefined} aria-label={overflow?"Social links carousel":undefined} tabIndex={overflow?0:undefined}
  onPointerEnter={e=>{if(e.pointerType==="mouse")hovered.current=true;}} onPointerLeave={()=>{hovered.current=false;pause();}}
  onFocusCapture={e=>{focused.current=e.target.matches(":focus-visible");}} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget)){focused.current=false;pause();}}}
  onPointerDown={e=>{if(e.button!==0)return;pause();drag.current={x:e.clientX,y:e.clientY,left:e.currentTarget.scrollLeft,moved:false};}}
  onPointerMove={e=>{const d=drag.current;if(!d)return;const x=e.clientX-d.x,y=e.clientY-d.y;if(!d.moved&&(Math.abs(x)<6||Math.abs(x)<=Math.abs(y)))return;d.moved=true;e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();e.currentTarget.scrollLeft=d.left-x;suppressUntil.current=performance.now()+350;e.currentTarget.dataset.socialDragUntil=String(suppressUntil.current);}}
  onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
  onClickCapture={e=>{if(performance.now()<suppressUntil.current){e.preventDefault();e.stopPropagation();}}}
  onWheel={pause} onKeyDown={e=>{pause();if(e.target!==e.currentTarget)return;if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();e.currentTarget.scrollBy({left:e.key==="ArrowLeft"?-64:64,behavior:"auto"});}}}
 >{children}</div>;
}
