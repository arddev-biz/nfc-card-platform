import { notFound, redirect } from "next/navigation";
import { getCardForRedirect } from "@/lib/services/nfc-cards";
import { getPublicBusinessProfile } from "@/lib/services/public-profile";

export const runtime = "nodejs";
// A card's status (and its business's status) can change at any time via
// the admin — this resolver must never serve a cached/stale decision.
export const dynamic = "force-dynamic";

interface PageProps {
  params: { cardToken: string };
}

/**
 * This route is intentionally a resolver, not a renderer: it never shows
 * the business profile itself, only decides whether to redirect to it.
 * `notFound()`/`redirect()` require the React render pipeline (a Server
 * Component), which is why this is a page.tsx rather than a route.ts
 * handler — Route Handlers can't call either of those.
 */
export default async function NfcCardRedirectPage({ params }: PageProps) {
  const card = await getCardForRedirect(params.cardToken);

  // Unknown token: identical 404 to any other nonexistent route. Never
  // reveal whether a token "almost" matched something.
  if (!card) {
    notFound();
  }

  // Card exists but isn't active — a distinct, honest message (per spec),
  // not a redirect and not a bare 404, since the physical card itself is
  // real and the merchant/support may need to recognize this state.
  if (card.status !== "ACTIVE" || !card.organization) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-center text-sm text-slate-500">
          This NFC card is currently inactive.
        </p>
      </main>
    );
  }

  // Re-validated through the exact same rules the public profile page
  // itself enforces (ACTIVE organization, profile exists) — a card can
  // never bypass a suspended/archived business just because the card's
  // own status is ACTIVE. Deliberately reuses getPublicBusinessProfile
  // rather than duplicating that visibility logic here.
  const publicProfile = await getPublicBusinessProfile(card.organization.slug);
  if (!publicProfile) {
    notFound();
  }

  redirect(`/${card.organization.slug}`);
}
