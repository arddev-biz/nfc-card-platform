import type { Metadata } from "next";
import type { CSSProperties } from "react";
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
  const activeLinkTypes = new Set(profile.links.map((link) => link.type));
  const menuAvailable = await isMenuAvailableForSlug(params.businessSlug);

  const quickActions = [
    profile.phone && !activeLinkTypes.has("PHONE")
      ? { key: "phone", href: buildLinkHref("PHONE", profile.phone), label: "Call" }
      : null,
    profile.email && !activeLinkTypes.has("EMAIL")
      ? { key: "email", href: buildLinkHref("EMAIL", profile.email), label: "Email" }
      : null,
    profile.website && !activeLinkTypes.has("WEBSITE") && isRenderableLinkValue("WEBSITE", profile.website)
      ? { key: "website", href: profile.website, label: "Website" }
      : null,
    profile.googleMapsUrl &&
    !activeLinkTypes.has("GOOGLE_MAPS") &&
    isRenderableLinkValue("GOOGLE_MAPS", profile.googleMapsUrl)
      ? { key: "maps", href: profile.googleMapsUrl, label: "Directions" }
      : null,
  ].filter(Boolean) as { key: string; href: string; label: string }[];

  const renderableLinks = profile.links.filter((link) => isRenderableLinkValue(link.type, link.url));

  return (
    <main
      className="min-h-screen bg-slate-50"
      style={{ ["--theme" as string]: themeColor } as CSSProperties}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col pb-10">
        {profile.coverImageUrl && (
          <div className="relative h-40 w-full sm:h-56">
            <Image
              src={profile.coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className={`px-4 ${profile.coverImageUrl ? "-mt-10" : "pt-10"}`}>
          <header className="text-center">
            {profile.logoUrl && (
              <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-4 border-slate-50 shadow-sm">
                <Image
                  src={profile.logoUrl}
                  alt={profile.displayName}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-900">
              {profile.displayName || business.name}
            </h1>
            {business.businessType && (
              <p className="mt-1 text-sm font-medium text-[var(--theme)]">{business.businessType}</p>
            )}
            {profile.bio && <p className="mt-3 text-sm leading-relaxed text-slate-600">{profile.bio}</p>}
          </header>

          {profile.address && (
            <p className="mt-4 text-center text-sm text-slate-500">{profile.address}</p>
          )}

          {menuAvailable && (
            <NextLink
              href={`/${params.businessSlug}/menu`}
              className="mt-6 block rounded-xl bg-[var(--theme)] px-5 py-4 text-center text-base font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
            >
              View Menu
            </NextLink>
          )}

          {quickActions.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickActions.map((action) => (
                <a
                  key={action.key}
                  href={action.href}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
                >
                  {action.label}
                </a>
              ))}
            </div>
          )}

          {renderableLinks.length > 0 && (
            <nav className="mt-8 flex flex-col gap-3" aria-label="Business links">
              {renderableLinks.map((link) => {
                const href = buildLinkHref(link.type, link.url);
                const external = opensInNewTab(link.type);
                return (
                  <a
                    key={link.id}
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-3 rounded-xl bg-[var(--theme)] px-5 py-4 text-base font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
                  >
                    <LinkIcon type={link.type} className="h-5 w-5 shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </a>
                );
              })}
            </nav>
          )}

          {renderableLinks.length === 0 && quickActions.length === 0 && !menuAvailable && (
            <p className="mt-10 text-center text-sm text-slate-400">
              This business hasn&apos;t added any links yet.
            </p>
          )}

          <footer className="pt-12 text-center text-xs text-slate-400">
            {profile.displayName || business.name}
          </footer>
        </div>
      </div>
    </main>
  );
}
