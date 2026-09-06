/**
 * The app has no existing site-URL configuration, so this adds the
 * simplest one that works: an optional environment variable with a
 * sensible local default. Used only to display/copy an absolute NFC
 * card URL in the admin UI — physical cards need a real, working URL
 * regardless of where they're viewed from, not a relative path.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return (configured || "http://localhost:3000").replace(/\/+$/, "");
}

export function getCardUrl(token: string): string {
  return `${getSiteUrl()}/c/${token}`;
}
