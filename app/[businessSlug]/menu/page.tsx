import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicMenu } from "@/lib/services/public-menu";
import { formatPrice } from "@/lib/currency";

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

  return (
    <main
      className={`min-h-screen bg-slate-50 ${menu.theme ? "profile-v2 v2-menu" : ""}`}
      data-profile-theme={menu.theme ?? undefined} data-radius={menu.design?.radius} data-density={menu.design?.density} data-default-surface={menu.design?.surface}
      data-appearance={menu.backgroundMode === "DARK" ? "dark" : "light"}
      style={{ ["--theme" as string]: themeColor } as CSSProperties}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8">
        <Link
          href={`/${params.businessSlug}`}
          className="text-sm text-slate-500 hover:underline"
        >
          ← {menu.businessName}
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">{menu.menuName}</h1>
        {menu.menuDescription && (
          <p className="mt-1 text-sm text-slate-600">{menu.menuDescription}</p>
        )}

        <div className="mt-6 space-y-8 pb-10">
          {menu.categories.map((category) => (
            <section key={category.id}>
              <h2 className="text-lg font-semibold text-[var(--theme)]">{category.name}</h2>
              {category.description && (
                <p className="mt-1 text-sm text-slate-500">{category.description}</p>
              )}
              <ul className="mt-3 divide-y divide-slate-200">
                {category.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
                      )}
                    </div>
                    <p className="shrink-0 font-semibold text-slate-900">
                      {formatPrice(item.priceMinor, item.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
