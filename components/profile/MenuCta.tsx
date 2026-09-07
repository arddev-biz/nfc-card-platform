import Image from "next/image";
import NextLink from "next/link";
import type { ProfileTheme } from "./theme";
import { ChevronRight } from "./icons";

interface MenuCtaProps {
  href: string;
  thumbnailUrl: string | null;
  theme: ProfileTheme;
}

export function MenuCta({ href, thumbnailUrl, theme }: MenuCtaProps) {
  return (
    <NextLink
      href={href}
      className={`flex items-center gap-4 rounded-[1.5rem] p-3 ${theme.panel} ${theme.press}`}
    >
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15">
        {thumbnailUrl ? (
          <Image src={thumbnailUrl} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: theme.accentTint, color: theme.accent }}
          >
            <MenuGlyph className="h-6 w-6" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-display text-lg font-semibold leading-tight ${theme.text}`}>
          View the Menu
        </span>
        <span className={`mt-0.5 block font-body text-xs ${theme.subtext}`}>
          Explore seasonal dishes &amp; pairings
        </span>
      </span>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: theme.accentTint, color: theme.accent }}
      >
        <ChevronRight className="h-4 w-4" />
      </span>
    </NextLink>
  );
}

function MenuGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}
