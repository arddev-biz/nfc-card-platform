// TEMPORARY verification harness — renders the redesigned profile with
// static demo data so the Liquid Glass design can be screenshotted while
// the database is unavailable in this sandbox. Deleted after review.
import { resolveBackground } from "@/lib/background";
import { buildProfileTheme } from "@/components/profile/theme";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { PrimaryActions } from "@/components/profile/PrimaryActions";
import { MenuCta } from "@/components/profile/MenuCta";
import { LinkList } from "@/components/profile/LinkList";
import { InfoCard } from "@/components/profile/InfoCard";

export const runtime = "nodejs";

export default function PreviewProfilePage() {
  const background = resolveBackground({
    backgroundType: "IMAGE",
    backgroundColor: null,
    backgroundGradient: null,
    backgroundImageUrl: "/demo/background.png",
    backgroundMode: "DARK",
  });
  const theme = buildProfileTheme("#C6A15B", background);

  return (
    <main className="relative min-h-screen" style={background.style}>
      <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: theme.scrimColor }} />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col pb-16">
        <ProfileHero
          coverImageUrl="/demo/cover.png"
          logoUrl="/demo/logo.png"
          displayName="Lumière"
          businessType="Restaurant"
          bio="A candlelit dining room where seasonal ingredients meet quiet luxury. Reservations recommended."
          theme={theme}
        />
        <div className="mt-7 flex flex-col gap-4 px-5">
          <PrimaryActions
            theme={theme}
            actions={[
              { key: "call", type: "PHONE", label: "Call", href: "#", external: false },
              { key: "wa", type: "WHATSAPP", label: "WhatsApp", href: "#", external: true },
              { key: "dir", type: "GOOGLE_MAPS", label: "Directions", href: "#", external: true },
              { key: "rev", type: "GOOGLE_REVIEWS", label: "Reviews", href: "#", external: true },
            ]}
          />
          <MenuCta href="#" thumbnailUrl="/demo/cover.png" theme={theme} />
          <div className="mt-1">
            <LinkList
              theme={theme}
              links={[
                { id: "1", type: "INSTAGRAM", label: "Instagram", href: "#", external: true },
                { id: "2", type: "FACEBOOK", label: "Facebook", href: "#", external: true },
                { id: "3", type: "BOOKING", label: "Reserve a Table", href: "#", external: true },
                { id: "4", type: "WEBSITE", label: "Visit our Website", href: "#", external: true },
              ]}
            />
          </div>
          <InfoCard
            theme={theme}
            rows={[
              { key: "a", kind: "address", label: "Rruga Pjetër Bogdani 12, Tirana" },
              { key: "p", kind: "phone", label: "+355 69 555 0142", href: "#" },
              { key: "w", kind: "website", label: "lumiere.example", href: "#" },
            ]}
          />
          <footer className={`pt-10 text-center font-display text-sm italic tracking-wide ${theme.muted}`}>
            Lumière
          </footer>
        </div>
      </div>
    </main>
  );
}
