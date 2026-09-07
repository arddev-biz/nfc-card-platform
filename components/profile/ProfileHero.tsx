import Image from "next/image";
import type { ProfileTheme } from "./theme";

interface ProfileHeroProps {
  coverImageUrl: string | null;
  logoUrl: string | null;
  displayName: string;
  businessType: string | null;
  bio: string | null;
  theme: ProfileTheme;
}

export function ProfileHero({
  coverImageUrl,
  logoUrl,
  displayName,
  businessType,
  bio,
  theme,
}: ProfileHeroProps) {
  const fade = theme.isDark ? "rgba(6,6,8,0.96)" : "rgba(255,255,255,0.94)";

  return (
    <section className="relative">
      <div className="relative h-72 w-full overflow-hidden sm:h-80">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 448px"
            className="object-cover"
            priority
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(140deg, ${theme.accent}, ${theme.accent}22)` }}
          />
        )}
        {/* Fade the cover into the page background so the glass below reads cleanly. */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, transparent 35%, ${fade} 100%)` }}
        />
      </div>

      <header className="relative -mt-20 px-6 text-center">
        {logoUrl && (
          <div className={`mx-auto mb-4 h-28 w-28 rounded-full p-1.5 ${theme.panelStrong}`}>
            <span className="relative block h-full w-full overflow-hidden rounded-full">
              <Image src={logoUrl} alt={displayName} fill sizes="112px" className="object-cover" />
            </span>
          </div>
        )}
        <h1 className={`font-display text-[2rem] font-semibold leading-tight tracking-tight text-balance ${theme.text}`}>
          {displayName}
        </h1>
        {businessType && (
          <span
            className="mt-3 inline-flex items-center rounded-full px-3.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.14em] ring-1"
            style={{ backgroundColor: theme.accentTint, color: theme.accent, borderColor: "transparent" }}
          >
            {businessType}
          </span>
        )}
        {bio && (
          <p className={`mx-auto mt-4 max-w-sm font-body text-sm leading-relaxed text-pretty ${theme.subtext}`}>
            {bio}
          </p>
        )}
      </header>
    </section>
  );
}
