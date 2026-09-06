import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { LeadForm } from "@/components/marketing/LeadForm";

export const metadata: Metadata = {
  title: "Get Your NFC Card",
  description: "Tell us about your business and we'll set up your NFC card and digital profile.",
};

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <main className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-bold tracking-tight text-brand-offwhite sm:text-4xl">
            Get Your NFC Card
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-offwhite/70">
            Tell us a bit about your business and we&apos;ll reach out to set up your NFC card and
            digital profile.
          </p>
        </div>

        <div className="mt-10">
          <LeadForm />
        </div>

        <p className="mt-6 text-center text-sm text-brand-offwhite/50">
          <Link href="/" className="hover:text-brand-offwhite/80">
            &larr; Back to home
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
