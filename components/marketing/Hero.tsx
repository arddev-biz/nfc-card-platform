import { GlassPanel } from "@/components/marketing/GlassPanel";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:pt-24">
      {/* Soft ambient glow — subtle, not a flood of neon */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand-lime/20 blur-[120px]" />

      <div className="relative mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-brand-lime">
            NFC Business Cards
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-brand-offwhite sm:text-5xl">
            Your business.
            <br />
            One simple tap.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-brand-offwhite/70">
            Customers tap your NFC card and instantly land on your digital business
            profile — social media, WhatsApp, phone, website, location, Google
            Reviews, and your menu, all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#pricing"
              className="rounded-full bg-brand-lime px-6 py-3 text-sm font-semibold text-brand-dark transition-transform hover:scale-[1.03]"
            >
              Get Your NFC Card
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-brand-offwhite/70 hover:text-brand-offwhite"
            >
              See how it works →
            </a>
          </div>
        </div>

        <div className="relative flex justify-center">
          <GlassPanel className="w-full max-w-xs p-6">
            <div className="flex items-center gap-2 text-xs text-brand-offwhite/50">
              <span className="h-2 w-2 rounded-full bg-brand-lime" />
              Tap detected
            </div>
            <div className="mt-4 rounded-xl bg-brand-offwhite/95 p-4 text-brand-dark">
              <div className="mx-auto h-12 w-12 rounded-full bg-brand-dark/10" />
              <p className="mt-3 text-center text-sm font-semibold">Your Business Name</p>
              <p className="text-center text-xs text-brand-slate">Café · Downtown</p>
              <div className="mt-4 space-y-2">
                {["Instagram", "WhatsApp", "Google Reviews", "Menu"].map((item) => (
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
          <div className="absolute -bottom-4 -right-4 -z-10 h-24 w-24 rounded-full bg-brand-lime/30 blur-2xl" />
        </div>
      </div>
    </section>
  );
}
