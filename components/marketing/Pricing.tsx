import { GlassPanel } from "@/components/marketing/GlassPanel";

const INCLUDED = [
  "1 NFC business card",
  "Digital business profile",
  "Unlimited profile link updates",
  "Digital menu (for restaurants & cafés)",
  "Platform access & support",
  "1 year of included service",
];

export function Pricing() {
  return (
    <section id="pricing" className="px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-brand-offwhite">
          Simple, one-time pricing
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-brand-offwhite/60">
          One package, everything included — no subscriptions to manage.
        </p>

        <GlassPanel className="mx-auto mt-10 max-w-md p-8">
          <p className="text-sm font-medium text-brand-lime">NFC Card + Profile</p>
          <p className="mt-2 text-sm text-brand-offwhite/60">
            Contact us for current pricing in your area.
          </p>
          <ul className="mt-6 space-y-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-brand-offwhite/80">
                <span className="mt-0.5 text-brand-lime">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <a
            href="/get-started"
            className="mt-8 block rounded-full bg-brand-lime px-6 py-3 text-center text-sm font-semibold text-brand-dark transition-transform hover:scale-[1.03]"
          >
            Get Your NFC Card
          </a>
        </GlassPanel>
      </div>
    </section>
  );
}
