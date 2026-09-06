import { GlassPanel } from "@/components/marketing/GlassPanel";

export function FinalCta() {
  return (
    <section id="contact" className="px-4 py-24">
      <GlassPanel className="mx-auto max-w-3xl p-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-brand-offwhite">
          Give your customers one simple way to connect with your business.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-brand-offwhite/70">
          Get your NFC card set up and let customers reach you with a single tap.
        </p>
        <a
          href="/get-started"
          className="mt-8 inline-block rounded-full bg-brand-lime px-8 py-3 text-sm font-semibold text-brand-dark transition-transform hover:scale-[1.03]"
        >
          Get Your NFC Card
        </a>
      </GlassPanel>
    </section>
  );
}
