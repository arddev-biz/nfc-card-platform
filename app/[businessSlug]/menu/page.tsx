import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicMenu } from "@/lib/services/public-menu";
import { formatPrice } from "@/lib/currency";
import { resolveBackground } from "@/lib/background";
import { buildProfileTheme } from "@/components/profile/theme";
import { MenuCategoryNav } from "@/components/profile/MenuCategoryNav";
import { ArrowLeft } from "@/components/profile/icons";

export const runtime = "nodejs";
// Menu content and its visibility (module enabled, item active, business
// status) can change at any time via the admin — never serve a stale
// cached decision here.
export const dynamic = "force-dynamic";

const DEFAULT_THEME_COLOR = "#4F46E5";

interface PageProps {
  params: { businessSlug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const menu = await getPublicMenu(params.businessSlug);
  if (!menu) {
    return { title: "Menu" };
  }
  return { title: `${menu.menuName} — ${menu.businessName}` };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const menu = await getPublicMenu(params.businessSlug);

  // Nonexistent business, wrong status, disabled module, inactive menu,
  // or a menu with no active content to show all resolve to the same
  // 404 — getPublicMenu() is the single place that decision is made.
  if (!menu) {
    notFound();
  }

  const themeColor = menu.themeColor || DEFAULT_THEME_COLOR;
  const background = resolveBackground(menu.background);
  const theme = buildProfileTheme(themeColor, background);

  return (
    <main className="relative min-h-screen" style={background.style}>
      {background.hasImage && (
        <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: theme.scrimColor }} />
      )}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-16">
        {/* Hero */}
        <header className="pt-6">
          <Link
            href={`/${params.businessSlug}`}
            className={`inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2 pr-3.5 font-body text-xs font-semibold ${theme.panel} ${theme.press}`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className={theme.text}>{menu.businessName}</span>
          </Link>

          <div className="mt-6 flex items-center gap-4">
            {menu.logoUrl && (
              <div className={`h-16 w-16 shrink-0 rounded-full p-1 ${theme.panelStrong}`}>
                <span className="relative block h-full w-full overflow-hidden rounded-full">
                  <Image src={menu.logoUrl} alt="" fill sizes="64px" className="object-cover" />
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className={`font-body text-[11px] font-semibold uppercase tracking-[0.18em] ${theme.muted}`}>
                Menu
              </p>
              <h1 className={`font-display text-3xl font-semibold leading-tight text-balance ${theme.text}`}>
                {menu.menuName}
              </h1>
            </div>
          </div>

          {menu.menuDescription && (
            <p className={`mt-3 font-body text-sm leading-relaxed text-pretty ${theme.subtext}`}>
              {menu.menuDescription}
            </p>
          )}
        </header>

        <div className="mt-5">
          <MenuCategoryNav
            categories={menu.categories.map((c) => ({ id: c.id, name: c.name }))}
            theme={theme}
          />
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {menu.categories.map((category) => (
            <section
              key={category.id}
              id={`category-${category.id}`}
              className={`scroll-mt-24 rounded-[1.5rem] p-5 ${theme.panel}`}
            >
              <div className="flex items-center gap-3">
                <span className="h-px flex-1" style={{ backgroundColor: theme.accentRing }} />
                <h2
                  className="font-display text-xl font-semibold"
                  style={{ color: theme.accent }}
                >
                  {category.name}
                </h2>
                <span className="h-px flex-1" style={{ backgroundColor: theme.accentRing }} />
              </div>
              {category.description && (
                <p className={`mt-2 text-center font-body text-xs ${theme.subtext}`}>
                  {category.description}
                </p>
              )}

              <ul className={`mt-4 divide-y ${theme.divider}`}>
                {category.items.map((item) => (
                  <li key={item.id} className="flex items-baseline gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className={`font-body text-sm font-semibold ${theme.text}`}>{item.name}</p>
                      {item.description && (
                        <p className={`mt-0.5 font-body text-xs leading-relaxed ${theme.subtext}`}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span
                      className="mx-1 hidden h-px flex-1 self-center opacity-40 sm:block"
                      style={{ backgroundColor: theme.accentRing }}
                    />
                    <p
                      className="shrink-0 font-body text-sm font-semibold tabular-nums"
                      style={{ color: theme.accent }}
                    >
                      {formatPrice(item.priceMinor, item.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className={`pt-10 text-center font-display text-sm italic tracking-wide ${theme.muted}`}>
          {menu.businessName}
        </footer>
      </div>
    </main>
  );
}
