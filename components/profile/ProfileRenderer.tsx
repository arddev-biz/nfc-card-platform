import Image from "next/image";
import NextLink from "next/link";
import type { LinkType } from "@prisma/client";
import { buildLinkHref, opensInNewTab } from "@/lib/linkTypes";
import { resolveBackground } from "@/lib/background";
import { LinkIcon } from "@/components/profile/LinkIcon";
import type { PublicBusinessProfile } from "@/lib/services/public-profile";
import type { ProfileViewModel } from "@/lib/profileView";
import type { ResolvedBlock } from "@/lib/blocks/registry";

const DEFAULT_THEME_COLOR = "#4F46E5";

interface ProfileRendererProps {
  business: PublicBusinessProfile;
  viewModel: ProfileViewModel;
  /** Already filtered to visible-and-available, already sorted by position — this component only decides how each key renders, never whether/where. */
  blocks: ResolvedBlock[];
  menuAvailable: boolean;
  /** Used to build the "/menu" link. In the builder preview this can be any placeholder slug — the link is never actually followed there. */
  slug: string;
}

/** Simple generic menu/list glyph — matches LinkIcon's style (no brand logos, no new dependency). */
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

export function ProfileRenderer({ business, viewModel, blocks, menuAvailable, slug }: ProfileRendererProps) {
  const { profile } = business;
  const themeColor = profile.themeColor || DEFAULT_THEME_COLOR;
  const background = resolveBackground(profile);
  const isDark = background.mode === "dark";

  const cardClass = isDark
    ? "bg-white/10 backdrop-blur-sm ring-1 ring-white/10"
    : "bg-white ring-1 ring-slate-900/5";
  const primaryTextClass = isDark ? "text-white" : "text-slate-900";
  const secondaryTextClass = isDark ? "text-white/70" : "text-slate-600";
  const mutedTextClass = isDark ? "text-white/40" : "text-slate-400";
  const dividerClass = isDark ? "divide-white/10" : "divide-slate-100";
  const badgeTintStyle = { backgroundColor: `${themeColor}${isDark ? "33" : "1A"}`, color: themeColor };

  function actionButton(key: string, type: LinkType, label: string, href: string) {
    return (
      <a
        key={key}
        href={href}
        {...(opensInNewTab(type) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`flex flex-1 flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center shadow-sm transition-transform active:scale-[0.97] ${cardClass}`}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: themeColor }}
        >
          <LinkIcon type={type} className="h-5 w-5" />
        </span>
        <span className={`text-xs font-semibold ${primaryTextClass}`}>{label}</span>
      </a>
    );
  }

  function renderBlock(block: ResolvedBlock) {
    switch (block.key) {
      case "BIO":
        return profile.bio ? (
          <p key="bio" className={`text-sm leading-relaxed ${secondaryTextClass}`}>
            {profile.bio}
          </p>
        ) : null;

      case "CONTACT": {
        const items = [
          viewModel.callHref ? { key: "call", type: "PHONE" as const, label: "Call", href: viewModel.callHref } : null,
          viewModel.whatsappHref
            ? { key: "whatsapp", type: "WHATSAPP" as const, label: "WhatsApp", href: viewModel.whatsappHref }
            : null,
        ].filter((x): x is NonNullable<typeof x> => x !== null);
        if (items.length === 0) return null;
        return (
          <div key="contact" className="flex gap-3">
            {items.map((item) => actionButton(item.key, item.type, item.label, item.href))}
          </div>
        );
      }

      case "LOCATION": {
        if (!viewModel.directionsHref) return null;
        const cfg = block.config as { buttonLabel?: string } | null;
        const label = typeof cfg?.buttonLabel === "string" && cfg.buttonLabel.trim() ? cfg.buttonLabel : "Directions";
        return <div key="location">{actionButton("directions", "GOOGLE_MAPS", label, viewModel.directionsHref)}</div>;
      }

      case "REVIEWS": {
        if (!viewModel.reviewsHref) return null;
        const cfg = block.config as { title?: string; style?: "standard" | "card" | "featured" } | null;
        const title = typeof cfg?.title === "string" && cfg.title.trim() ? cfg.title : "Google Reviews";
        const style = cfg?.style === "card" || cfg?.style === "featured" ? cfg.style : "standard";

        if (style === "standard") {
          return <div key="reviews">{actionButton("reviews", "GOOGLE_REVIEWS", title, viewModel.reviewsHref)}</div>;
        }

        // "card" and "featured" use the same wide-row treatment as
        // Links/Menu, with "featured" simply larger/bolder — still just
        // presentation, never arbitrary styling.
        return (
          <a
            key="reviews"
            href={viewModel.reviewsHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 rounded-2xl shadow-sm transition-transform active:scale-[0.98] ${cardClass} ${
              style === "featured" ? "px-5 py-5" : "px-4 py-3.5"
            }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-full text-white ${
                style === "featured" ? "h-11 w-11" : "h-9 w-9"
              }`}
              style={{ backgroundColor: themeColor }}
            >
              <LinkIcon type="GOOGLE_REVIEWS" className={style === "featured" ? "h-5 w-5" : "h-4 w-4"} />
            </span>
            <span
              className={`truncate font-semibold ${primaryTextClass} ${style === "featured" ? "text-base" : "text-sm"}`}
            >
              {title}
            </span>
          </a>
        );
      }

      case "MENU":
        return menuAvailable ? (
          <NextLink
            key="menu"
            href={`/${slug}/menu`}
            className={`flex items-center justify-between rounded-2xl px-5 py-4 shadow-sm transition-transform active:scale-[0.98] ${cardClass}`}
          >
            <span className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: themeColor }}
              >
                <MenuGlyph className="h-5 w-5" />
              </span>
              <span className="text-left">
                <span className={`block text-sm font-semibold ${primaryTextClass}`}>View Menu</span>
                <span className={`block text-xs ${secondaryTextClass}`}>See our full menu</span>
              </span>
            </span>
            <span className={mutedTextClass}>&rarr;</span>
          </NextLink>
        ) : null;

      case "LINKS":
        return viewModel.secondaryLinks.length > 0 ? (
          <nav key="links" aria-label="Business links">
            <ul className="flex flex-col gap-2.5">
              {viewModel.secondaryLinks.map((link) => {
                const href = buildLinkHref(link.type, link.url);
                const external = opensInNewTab(link.type);
                return (
                  <li key={link.id}>
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm transition-transform active:scale-[0.98] ${cardClass}`}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={badgeTintStyle}
                      >
                        <LinkIcon type={link.type} className="h-4 w-4" />
                      </span>
                      <span className={`truncate text-sm font-semibold ${primaryTextClass}`}>{link.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null;

      case "BUSINESS_INFO":
        return viewModel.businessInfoRows.length > 0 ? (
          <div key="business-info" className={`rounded-2xl p-4 shadow-sm ${cardClass}`}>
            <ul className={`divide-y ${dividerClass}`}>
              {viewModel.businessInfoRows.map((row) =>
                row.href ? (
                  <li key={row.key}>
                    <a
                      href={row.href}
                      className={`block py-2.5 text-sm transition-opacity hover:opacity-70 ${secondaryTextClass}`}
                    >
                      {row.label}
                    </a>
                  </li>
                ) : (
                  <li key={row.key} className={`py-2.5 text-sm ${secondaryTextClass}`}>
                    {row.label}
                  </li>
                )
              )}
            </ul>
          </div>
        ) : null;

      default:
        return null;
    }
  }

  const renderedBlocks = blocks.map(renderBlock).filter(Boolean);
  const hasAnyContent = renderedBlocks.length > 0;

  return (
    <main className="relative min-h-screen" style={background.style}>
      {background.hasImage && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)" }}
        />
      )}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col pb-12">
        {/* HEADER — fixed, not a reorderable/hideable block (a profile without one doesn't make sense) */}
        <div className="relative">
          <div
            className="relative h-48 w-full overflow-hidden rounded-b-3xl sm:h-64"
            style={{ background: `linear-gradient(135deg, ${themeColor}40, ${themeColor}0D)` }}
          >
            {profile.coverImageUrl && (
              <Image
                src={profile.coverImageUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 448px"
                className="object-cover"
                priority
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
          </div>

          <header className={`px-5 text-center ${profile.logoUrl ? "-mt-12" : "mt-5"}`}>
            {profile.logoUrl && (
              <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                <Image src={profile.logoUrl} alt={profile.displayName} fill sizes="96px" className="object-cover" />
              </div>
            )}
            <h1 className={`text-2xl font-bold tracking-tight ${primaryTextClass}`}>
              {profile.displayName || business.name}
            </h1>
            {business.businessType && (
              <span className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={badgeTintStyle}>
                {business.businessType}
              </span>
            )}
          </header>
        </div>

        <div className="flex flex-col gap-4 px-5 pt-6">
          {renderedBlocks}

          {!hasAnyContent && (
            <p className={`mt-4 text-center text-sm ${mutedTextClass}`}>
              This business hasn&apos;t added any links yet.
            </p>
          )}

          <footer className={`pt-8 text-center text-xs ${mutedTextClass}`}>
            {profile.displayName || business.name}
          </footer>
        </div>
      </div>
    </main>
  );
}
