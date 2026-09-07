import type { Metadata } from "next";
import type { LinkType } from "@prisma/client";
import { notFound } from "next/navigation";
import { getPublicBusinessProfile } from "@/lib/services/public-profile";
import { isMenuAvailableForSlug } from "@/lib/services/public-menu";
import { buildLinkHref, isRenderableLinkValue, opensInNewTab } from "@/lib/linkTypes";
import { resolveBackground } from "@/lib/background";
import { buildProfileTheme } from "@/components/profile/theme";
import { StickyProfileHeader } from "@/components/profile/StickyProfileHeader";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { PrimaryActions, type PrimaryAction } from "@/components/profile/PrimaryActions";
import { MenuCta } from "@/components/profile/MenuCta";
import { LinkList, type ProfileLinkItem } from "@/components/profile/LinkList";
import { InfoCard, type InfoRow } from "@/components/profile/InfoCard";

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
  const background = resolveBackground(profile);
  const theme = buildProfileTheme(themeColor, background);

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
    phoneHref
      ? { key: "call", type: "PHONE" as const, label: "Call", href: phoneHref, external: false }
      : null,
    whatsappLink
      ? {
          key: "whatsapp",
          type: "WHATSAPP" as const,
          label: "WhatsApp",
          href: buildLinkHref("WHATSAPP", whatsappLink.url),
          external: opensInNewTab("WHATSAPP"),
        }
      : null,
    mapsHref
      ? {
          key: "directions",
          type: "GOOGLE_MAPS" as const,
          label: "Directions",
          href: mapsHref,
          external: opensInNewTab("GOOGLE_MAPS"),
        }
      : null,
    reviewsLink
      ? {
          key: "reviews",
          type: "GOOGLE_REVIEWS" as const,
          label: "Reviews",
          href: buildLinkHref("GOOGLE_REVIEWS", reviewsLink.url),
          external: opensInNewTab("GOOGLE_REVIEWS"),
        }
      : null,
  ].filter(Boolean) as PrimaryAction[];

  // Everything else — the four primary-action types never appear twice.
  const secondaryLinks = renderableLinks
    .filter((link) => !["PHONE", "WHATSAPP", "GOOGLE_MAPS", "GOOGLE_REVIEWS"].includes(link.type))
    .map<ProfileLinkItem>((link) => ({
      id: link.id,
      type: link.type,
      label: link.label || link.type,
      href: buildLinkHref(link.type, link.url),
      external: opensInNewTab(link.type),
    }));

  const hasExplicitWebsiteLink = linksByType.has("WEBSITE");
  const businessInfoRows = [
    profile.address ? { key: "address", kind: "address" as const, label: profile.address } : null,
    profile.phone
      ? {
          key: "phone",
          kind: "phone" as const,
          label: profile.phone,
          href: buildLinkHref("PHONE", profile.phone),
        }
      : null,
    profile.website && !hasExplicitWebsiteLink
      ? {
          key: "website",
          kind: "website" as const,
          label: profile.website.replace(/^https?:\/\//, ""),
          href: profile.website,
        }
      : null,
  ].filter(Boolean) as InfoRow[];

  const hasAnyContent =
    primaryActions.length > 0 ||
    secondaryLinks.length > 0 ||
    businessInfoRows.length > 0 ||
    menuAvailable;

  const displayName = profile.displayName || business.name;

  return (
    <main className="relative min-h-screen" style={background.style}>
      {background.hasImage && (
        <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: theme.scrimColor }} />
      )}

      <StickyProfileHeader name={displayName} logoUrl={profile.logoUrl} theme={theme} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col pb-16">
        <ProfileHero
          coverImageUrl={profile.coverImageUrl}
          logoUrl={profile.logoUrl}
          displayName={displayName}
          businessType={business.businessType}
          bio={profile.bio}
          theme={theme}
        />

        <div className="mt-7 flex flex-col gap-4 px-5">
          <PrimaryActions actions={primaryActions} theme={theme} />

          {menuAvailable && (
            <MenuCta
              href={`/${params.businessSlug}/menu`}
              thumbnailUrl={profile.coverImageUrl}
              theme={theme}
            />
          )}

          {secondaryLinks.length > 0 && (
            <div className="mt-1">
              <LinkList links={secondaryLinks} theme={theme} />
            </div>
          )}

          {businessInfoRows.length > 0 && <InfoCard rows={businessInfoRows} theme={theme} />}

          {!hasAnyContent && (
            <p className={`mt-10 text-center font-body text-sm ${theme.muted}`}>
              This business hasn&apos;t added any links yet.
            </p>
          )}

          <footer
            className={`pt-10 text-center font-display text-sm italic tracking-wide ${theme.muted}`}
          >
            {displayName}
          </footer>
        </div>
      </div>
    </main>
  );
}
