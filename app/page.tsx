import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Features } from "@/components/marketing/Features";
import { ExampleProfile } from "@/components/marketing/ExampleProfile";
import { WhyNfc } from "@/components/marketing/WhyNfc";
import { Pricing } from "@/components/marketing/Pricing";
import { Faq } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "NFC Card Platform — Your business, one simple tap",
  description:
    "NFC business cards connected to a personalized digital profile — social links, WhatsApp, Google Reviews, and your menu, all in one tap.",
  openGraph: {
    title: "NFC Card Platform — Your business, one simple tap",
    description:
      "NFC business cards connected to a personalized digital profile — social links, WhatsApp, Google Reviews, and your menu, all in one tap.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <ExampleProfile />
        <WhyNfc />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
