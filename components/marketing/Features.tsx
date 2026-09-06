import { GlassPanel } from "@/components/marketing/GlassPanel";

const FEATURES = [
  { title: "Digital Business Profile", description: "A clean, mobile-first page with everything customers need to know." },
  { title: "NFC Card", description: "A single tap opens your profile — no app, no typing, no searching." },
  { title: "Social & Contact Links", description: "Instagram, Facebook, TikTok, phone, email, and website in one place." },
  { title: "WhatsApp", description: "One tap starts a WhatsApp chat with your business." },
  { title: "Google Maps", description: "Customers get directions instantly." },
  { title: "Google Reviews", description: "A dedicated, prominent link straight to your review page." },
  { title: "Digital Menu", description: "Restaurants and cafés can showcase categories, items, and prices." },
  { title: "Mobile-Friendly", description: "Built for the phone in your customer's hand." },
];

export function Features() {
  return (
    <section id="features" className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-brand-offwhite">
          Everything your customers need
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-brand-offwhite/60">
          One profile, built to make the most important information one tap away.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <GlassPanel key={feature.title} className="p-5">
              <h3 className="text-sm font-semibold text-brand-offwhite">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-brand-offwhite/60">
                {feature.description}
              </p>
            </GlassPanel>
          ))}
        </div>
      </div>
    </section>
  );
}
