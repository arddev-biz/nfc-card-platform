import type { Metadata } from "next";
import type { LinkType } from "@prisma/client";
import Image from "next/image";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { getPublicBusinessProfile } from "@/lib/services/public-profile";
import { isMenuAvailableForSlug } from "@/lib/services/public-menu";
import { buildLinkHref, isRenderableLinkValue, opensInNewTab } from "@/lib/linkTypes";
import { LinkIcon } from "@/components/profile/LinkIcon";

export const runtime = "nodejs";

interface PageProps {
  params: { businessSlug: string };
}

const DEFAULT_THEME_COLOR = "#4F46E5";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const business = await getPublicBusinessProfile(params.businessSlug);

  if (!business || !business.profile) {
    return { title: "Business not found" };
  }

  const name = business.profile.displayName || business.name;

  return {
    title: name,
    description: business.profile.bio?.slice(0, 160) || `${name} — contact and links.`,
  };
}

export default async function PublicBusinessProfilePage({ params }: PageProps) {
  const business = await getPublicBusinessProfile(params.businessSlug);

  if (!business) {
    notFound();
  }

  const { profile } = business;
  const themeColor = profile.themeColor || DEFAULT_THEME_COLOR;
  const menuAvailable = await isMenuAvailableForSlug(params.businessSlug);

  const renderableLinks = profile.links.filter((link) => isRenderableLinkValue(link.type, link.url));
  const linksByType = new Map(renderableLinks.map((link) => [link.type, link]));

  // Primary Actions: Call, WhatsApp, Directions, Google Reviews — these
  // four types are always promoted here (never shown a second time in
  // the Social/Business Links section below), sourced from either a
  // direct profile field or a matching ProfileLink, whichever exists.
  const whatsappLink = linksByType.get("WHATSAPP");
  const reviewsLink = linksByType.get("GOOGLE_REVIEWS");
  const mapsLink = linksByType.get("GOOGLE_MAPS");
  const phoneHref =
    profile.phone && isRenderableLinkValue("PHONE", profile.phone)
      ? buildLinkHref("PHONE", profile.phone)
      : undefined;
  const mapsHref = profile.googleMapsUrl
    ? profile.googleMapsUrl
    : mapsLink
      ? buildLinkHref("GOOGLE_MAPS", mapsLink.url)
      : undefined;

  const primaryActions = [
    phoneHref ? { key: "call", type: "PHONE" as const, label: "Call", href: phoneHref } : null,
    whatsappLink
      ? {
          key: "whatsapp",
          type: "WHATSAPP" as const,
          label: "WhatsApp",
          href: buildLinkHref("WHATSAPP", whatsappLink.url),
        }
      : null,
    mapsHref ? { key: "directions", type: "GOOGLE_MAPS" as const, label: "Directions", href: mapsHref } : null,
    reviewsLink
      ? {
          key: "reviews",
          type: "GOOGLE_REVIEWS" as const,
          label: "Google Reviews",
          href: buildLinkHref("GOOGLE_REVIEWS", reviewsLink.url),
        }
      : null,
  ].filter(Boolean) as { key: string; type: LinkType; label: string; href: string }[];

  // Everything else — the four primary-action types never appear twice.
  const secondaryLinks = renderableLinks.filter(
    (link) => !["PHONE", "WHATSAPP", "GOOGLE_MAPS", "GOOGLE_REVIEWS"].includes(link.type)
  );

  const hasExplicitWebsiteLink = linksByType.has("WEBSITE");
  const businessInfoRows = [
    profile.address ? { key: "address", label: profile.address } : null,
    profile.phone ? { key: "phone", label: profile.phone, href: buildLinkHref("PHONE", profile.phone) } : null,
    profile.website && !hasExplicitWebsiteLink
      ? { key: "website", label: profile.website.replace(/^https?:\/\//, ""), href: profile.website }
      : null,
  ].filter(Boolean) as { key: string; label: string; href?: string }[];

  const hasAnyContent =
    primaryActions.length > 0 ||
    secondaryLinks.length > 0 ||
    businessInfoRows.length > 0 ||
    menuAvailable;

  return (
    <main className="min-h-screen bg-[#F7F7F8]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col pb-12">
        {/* 1. COVER / HERO */}
        <div className="relative">
          <div
            className="relative h-48 w-full overflow-hidden rounded-b-3xl sm:h-64"
            style={{
              background: `linear-gradient(135deg, ${themeColor}40, ${themeColor}0D)`,
            }}
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
              <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-[#F7F7F8] bg-white shadow-lg">
                <Image
                  src={profile.logoUrl}
                  alt={profile.displayName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {profile.displayName || business.name}
            </h1>
            {business.businessType && (
              <span
                className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}
              >
                {business.businessType}
              </span>
            )}
            {profile.bio && (
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
                {profile.bio}
              </p>
            )}
          </header>
        </div>

        <div className="px-5">
          {/* 2. PRIMARY ACTIONS */}
          {primaryActions.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {primaryActions.map((action) => (
                <a
                  key={action.key}
                  href={action.href}
                  {...(opensInNewTab(action.type) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-slate-900/5 transition-transform active:scale-[0.97]"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: themeColor }}
                  >
                    <LinkIcon type={action.type} className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{action.label}</span>
                </a>
              ))}
            </div>
          )}

          {/* 5. DIGITAL MENU — placed prominently, right after primary actions */}
          {menuAvailable && (
            <NextLink
              href={`/${params.businessSlug}/menu`}
              className="mt-4 flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-900/5 transition-transform active:scale-[0.98]"
            >
              <span className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  <MenuGlyph className="h-5 w-5" />
                </span>
                <span className="text-left">
                  <span className="block text-sm font-semibold text-slate-900">View Menu</span>
                  <span className="block text-xs text-slate-500">See our full menu</span>
                </span>
              </span>
              <span className="text-slate-300">&rarr;</span>
            </NextLink>
          )}

          {/* 3. SOCIAL / BUSINESS LINKS */}
          {secondaryLinks.length > 0 && (
            <nav className="mt-6" aria-label="Business links">
              <ul className="flex flex-col gap-2.5">
                {secondaryLinks.map((link) => {
                  const href = buildLinkHref(link.type, link.url);
                  const external = opensInNewTab(link.type);
                  return (
                    <li key={link.id}>
                      <a
                        href={href}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-900/5 transition-transform active:scale-[0.98]"
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}
                        >
                          <LinkIcon type={link.type} className="h-4 w-4" />
                        </span>
                        <span className="truncate text-sm font-semibold text-slate-800">{link.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {/* 4. BUSINESS INFORMATION */}
          {businessInfoRows.length > 0 && (
            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
              <ul className="divide-y divide-slate-100">
                {businessInfoRows.map((row) =>
                  row.href ? (
                    <li key={row.key}>
                      <a href={row.href} className="block py-2.5 text-sm text-slate-600 hover:text-slate-900">
                        {row.label}
                      </a>
                    </li>
                  ) : (
                    <li key={row.key} className="py-2.5 text-sm text-slate-600">
                      {row.label}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {!hasAnyContent && (
            <p className="mt-10 text-center text-sm text-slate-400">
              This business hasn&apos;t added any links yet.
            </p>
          )}

          {/* 7. FOOTER */}
          <footer className="pt-12 text-center text-xs text-slate-400">
            {profile.displayName || business.name}
          </footer>
        </div>
      </div>
    </main>
  );
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
