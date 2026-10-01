import type { Metadata } from "next";
import { LandingNavbar } from "@/components/marketing/landing/LandingNavbar";
import { Hero, Features, ProfileShowcase, NfcShowcase, HowItWorks, Pricing, SocialProof, Faq, FinalCta, MarketingFooter } from "@/components/marketing/landing/Sections";
import styles from "@/components/marketing/landing/landing.module.css";

export const metadata: Metadata = {
  title: "AuraLink — One tap. Infinite opportunities.",
  description: "Connect your NFC business card to a customizable digital profile. Share your links, menu, reviews and contact details with a tap or scan.",
  openGraph: { title: "AuraLink — One tap. Infinite opportunities.", description: "Your business. Your card. Everything connected.", type: "website" },
};
export default function LandingPage() {
  return <div className={styles.landing} id="home">
    <a className={styles.skip} href="#main-content">Skip to content</a>
    <LandingNavbar />
    <main id="main-content"><Hero /><Features /><ProfileShowcase /><NfcShowcase /><HowItWorks /><Pricing /><SocialProof /><Faq /><FinalCta /></main>
    <MarketingFooter />
  </div>;
}
