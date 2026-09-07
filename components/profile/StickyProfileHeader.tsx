"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ProfileTheme } from "./theme";

interface StickyProfileHeaderProps {
  name: string;
  logoUrl: string | null;
  theme: ProfileTheme;
}

/**
 * A frosted-glass condensed header that slides in once the hero has
 * scrolled away, giving the profile the persistent "app bar" feel of a
 * native hospitality app. Kept as the only client component on the page
 * — everything else renders on the server.
 */
export function StickyProfileHeader({ name, logoUrl, theme }: StickyProfileHeaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVisible(window.scrollY > 260));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-3 transition-all duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
      } ${visible ? "" : "pointer-events-none"}`}
    >
      <div
        className={`flex w-full max-w-md items-center gap-3 rounded-full px-3.5 py-2 ${theme.panelStrong}`}
      >
        {logoUrl ? (
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20">
            <Image src={logoUrl} alt="" fill sizes="32px" className="object-cover" />
          </span>
        ) : (
          <span
            className="h-8 w-8 shrink-0 rounded-full"
            style={{ backgroundColor: theme.accent }}
            aria-hidden
          />
        )}
        <span className={`truncate font-display text-sm font-semibold ${theme.text}`}>{name}</span>
      </div>
    </div>
  );
}
