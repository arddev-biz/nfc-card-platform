"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { LinkType } from "@prisma/client";
import {SemanticIcon} from "./SemanticIcon";
import { mediaConfig, type V2Image } from "@/lib/profile-v2";

export function ProfileLinkIcon({ type, mode, url, network, size = 24, iconSet = "FEATHER", iconStyle = "OUTLINE", iconColor = "MONOCHROME", destination }: { type: LinkType | "MENU"; mode: string; url: string | null; network?: string | null; size?: number; iconSet?:string; iconStyle?:string; iconColor?:string; destination?:string }) {
  const [broken, setBroken] = useState<string | null>(null);
  if (mode === "NONE") return null;
  return mode === "CUSTOM" && url && broken !== url
    ? <Image src={url} alt="" width={size} height={size} className="shrink-0 rounded object-cover" onError={() => setBroken(url)} />
    : <SemanticIcon type={type} network={network} destination={destination} size={size} iconSet={iconSet} iconStyle={iconStyle} iconColor={iconColor}/>;
}
export function ProfileMedia({ images, config, carousel = false }: { images: V2Image[]; config: unknown; carousel?: boolean }) {
  const result = mediaConfig.safeParse(config);
  const c = result.success ? result.data : mediaConfig.parse({});
  const track = useRef<HTMLDivElement>(null);
  const pauseUntil = useRef(0);
  const drag = useRef<{ x:number; scroll:number; moved:boolean } | null>(null);
  const suppressClick = useRef(false);
  const interacting = useRef(false);
  const hovered = useRef(false), focused = useRef(false);
  const [stopped, setStopped] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches); update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  function pause() { pauseUntil.current = Date.now() + 5000; if (!c.resume) setStopped(true); }
  function move(direction: number) {
    pause(); const el = track.current; if (!el) return;
    let next = Math.round(el.scrollLeft / el.clientWidth) + direction;
    if (c.loop) next = (next + images.length) % images.length;
    next = Math.max(0, Math.min(images.length - 1, next));
    el.scrollTo({ left: next * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
  }
  useEffect(() => {
    const el = track.current;
    if (!el || !carousel || !c.autoplay || reduced || stopped || images.length < 2) return;
    let frame = 0, previous = 0, lastSlide = 0, visible = true, fraction = 0;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(el);
    const speeds = { SLOW: 12, NORMAL: 22, FAST: 35 };
    const intervals = { SLOW: 7000, NORMAL: 5000, FAST: 3000 };
    function tick(now: number) {
      const delta = previous ? Math.min(now - previous, 64) : 0; previous = now;
      if (visible && !document.hidden && !interacting.current && Date.now() >= pauseUntil.current) {
        const node = track.current!;
        const max = node.scrollWidth - node.clientWidth;
        if (c.mode === "CONTINUOUS") {
          const end = c.loop ? node.scrollWidth / 2 : max;
          if (node.scrollLeft >= end - 1) { if (c.loop) node.scrollLeft -= end; }
          else {
            fraction += speeds[c.speed] * delta / 1000;
            if (fraction >= 1) { const pixels = Math.floor(fraction); node.scrollLeft += pixels; fraction -= pixels; }
          }
        } else if (now - lastSlide > intervals[c.speed]) {
          lastSlide = now;
          const next = node.scrollLeft + node.clientWidth;
          node.scrollTo({ left: next > max + 1 ? (c.loop ? 0 : max) : next, behavior: "smooth" });
        }
      } else lastSlide = now;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [carousel, c.autoplay, c.mode, c.speed, c.loop, reduced, stopped, images.length]);
  const ratio = { AUTO: undefined, SQUARE: "1 / 1", PORTRAIT: "3 / 4", LANDSCAPE: "16 / 9" }[c.ratio];
  return <div className="min-w-0" role={carousel ? "region" : undefined} aria-label={carousel ? "Image carousel" : undefined}
    onPointerEnter={() => { hovered.current=true; interacting.current = true; pause(); }} onPointerLeave={() => { hovered.current=false; interacting.current = focused.current || !!drag.current; pause(); }}
    onPointerDown={() => { interacting.current = true; pause(); }} onPointerUp={() => { interacting.current = hovered.current || focused.current; pause(); }}
    onPointerCancel={() => { interacting.current = hovered.current || focused.current; pause(); }}
    onFocusCapture={() => { focused.current=true; interacting.current = true; pause(); }} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) { focused.current=false; interacting.current = hovered.current || !!drag.current; pause(); } }}>
    <div ref={track} className={`v2-media flex overflow-x-auto rounded-2xl ${c.mode === "SLIDE" ? "snap-x snap-mandatory" : ""}`}
      style={{ touchAction:"pan-y" }}
      onPointerDown={e => { if (!carousel || e.button !== 0) return; drag.current={x:e.clientX,scroll:e.currentTarget.scrollLeft,moved:false}; suppressClick.current=false; interacting.current=true; pause(); }}
      onPointerMove={e => { const d=drag.current; if (!d) return; const delta=e.clientX-d.x; if (Math.abs(delta)>5) { d.moved=true; suppressClick.current=true; e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.style.scrollSnapType="none"; e.currentTarget.scrollLeft=d.scroll-delta; } }}
      onPointerUp={e => { const d=drag.current; drag.current=null; interacting.current=hovered.current || focused.current; pause(); e.currentTarget.style.scrollSnapType=""; if(d?.moved && c.mode==="SLIDE") e.currentTarget.scrollTo({left:Math.round(e.currentTarget.scrollLeft/e.currentTarget.clientWidth)*e.currentTarget.clientWidth,behavior:reduced?"auto":"smooth"}); }}
      onPointerCancel={e => { drag.current=null; interacting.current=hovered.current || focused.current; e.currentTarget.style.scrollSnapType=""; pause(); }}
      onClickCapture={e => { if(suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current=false; } }}
      onDragStart={e=>e.preventDefault()}
      onScroll={() => { const e = track.current; if (e?.clientWidth && images.length) setIndex(Math.round(e.scrollLeft / e.clientWidth) % images.length); }}
      onWheel={pause} onKeyDown={pause} tabIndex={carousel ? 0 : undefined}>
      {(carousel && c.mode === "CONTINUOUS" && c.loop && images.length > 1 ? [...images, ...images] : images).map((m,n) => {
        const picture = <Image src={m.url} alt={m.alt} width={600} height={600} sizes="(max-width: 480px) 90vw, 400px" style={{ aspectRatio: ratio }} className="h-auto w-full rounded-2xl object-cover" />;
        return <figure key={m.id+n} aria-hidden={n >= images.length ? true : undefined} className="w-full shrink-0 snap-start">
          {m.destinationUrl && n < images.length ? <a href={m.destinationUrl} target="_blank" rel="noopener noreferrer">{picture}</a> : picture}
          {m.caption && <figcaption className="p-2 text-sm">{m.caption}</figcaption>}
        </figure>;
      })}
    </div>
    {carousel && images.length > 1 && <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
      <button type="button" aria-label="Previous image" onClick={() => move(-1)} disabled={!c.loop && index === 0}>← Previous</button>
      {c.pagination && <span aria-live="off">{Math.min(index + 1, images.length)} / {images.length}</span>}
      <button type="button" aria-label="Next image" onClick={() => move(1)} disabled={!c.loop && index >= images.length - 1}>Next →</button>
      {c.autoplay && !reduced && <button type="button" onClick={() => { setStopped(!stopped); pauseUntil.current = Date.now() + 500; }}>{stopped ? "Play" : "Pause"}</button>}
    </div>}
  </div>;
}
