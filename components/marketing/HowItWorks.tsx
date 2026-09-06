import { GlassPanel } from "@/components/marketing/GlassPanel";

const STEPS = [
  {
    number: "1",
    title: "Tap",
    description: "The customer taps your NFC card with their phone — no app needed.",
  },
  {
    number: "2",
    title: "Open",
    description: "Your business profile opens instantly on their phone's browser.",
  },
  {
    number: "3",
    title: "Connect",
    description:
      "They reach your social media, WhatsApp, phone, website, location, Google Reviews, and menu — all in one tap.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-brand-offwhite">
          How it works
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <GlassPanel key={step.number} className="p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-lime text-sm font-bold text-brand-dark">
                {step.number}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-brand-offwhite">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-offwhite/70">
                {step.description}
              </p>
            </GlassPanel>
          ))}
        </div>
      </div>
    </section>
  );
}
