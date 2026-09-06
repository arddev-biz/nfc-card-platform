"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border border-white/10 bg-brand-dark/70 px-5 py-3 backdrop-blur-xl">
        <Link href="/" className="text-sm font-semibold tracking-tight text-brand-offwhite">
          NFC Card Platform
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-brand-offwhite/70 transition-colors hover:text-brand-offwhite"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#pricing"
            className="hidden rounded-full bg-brand-lime px-4 py-2 text-sm font-semibold text-brand-dark transition-transform hover:scale-[1.03] sm:inline-block"
          >
            Get Your NFC Card
          </a>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setIsOpen((v) => !v)}
            className="rounded-lg border border-white/10 p-2 text-brand-offwhite md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="mx-auto mt-2 max-w-5xl rounded-2xl border border-white/10 bg-brand-dark/90 p-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-sm text-brand-offwhite/80"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#pricing"
              onClick={() => setIsOpen(false)}
              className="mt-1 rounded-full bg-brand-lime px-4 py-2 text-center text-sm font-semibold text-brand-dark"
            >
              Get Your NFC Card
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
