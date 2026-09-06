import { GlassPanel } from "@/components/marketing/GlassPanel";

const DEMO_ITEMS = ["Instagram", "WhatsApp", "Google Reviews", "View Menu"];

export function ExampleProfile() {
  const demoSlug = process.env.NEXT_PUBLIC_DEMO_BUSINESS_SLUG;

  return (
    <section className="px-4 py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-brand-offwhite">
            See a real profile in action
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-brand-offwhite/70">
            This is exactly what your customers see the moment they tap your card —
            no app to download, no forms to fill in.
          </p>
          {demoSlug ? (
            <a
              href={`/${demoSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full bg-brand-lime px-6 py-3 text-sm font-semibold text-brand-dark transition-transform hover:scale-[1.03]"
            >
              View live example profile →
            </a>
          ) : (
            <p className="mt-6 text-sm text-brand-offwhite/50">
              A live example will be linked here once available.
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <GlassPanel className="w-full max-w-xs p-6">
            <div className="rounded-xl bg-brand-offwhite/95 p-5 text-brand-dark">
              <div className="mx-auto h-14 w-14 rounded-full bg-brand-dark/10" />
              <p className="mt-3 text-center text-sm font-semibold">Example Café</p>
              <p className="text-center text-xs text-brand-slate">Restaurant · City Center</p>
              <div className="mt-4 space-y-2">
                {DEMO_ITEMS.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg bg-brand-dark px-3 py-2 text-center text-xs font-medium text-brand-offwhite"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </section>
  );
}
