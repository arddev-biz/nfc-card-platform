"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "How does the NFC card work?",
    answer:
      "Customers hold their phone near the card for a second. Their phone opens your business profile automatically — no app or scanning required.",
  },
  {
    question: "Do customers need an app?",
    answer: "No. It opens directly in their phone's browser.",
  },
  {
    question: "Does it work on iPhone and Android?",
    answer:
      "Yes. Modern iPhones and Android phones both support NFC tap-to-open out of the box.",
  },
  {
    question: "What can customers see?",
    answer:
      "Your business profile with your description, contact details, social links, WhatsApp, Google Maps, Google Reviews, and your menu if you have one.",
  },
  {
    question: "Can business information be updated?",
    answer:
      "Yes. Your profile, links, and menu can be updated any time — your customers always see the latest version.",
  },
  {
    question: "Can restaurants use the digital menu?",
    answer:
      "Yes. Restaurants, cafés, bars, and similar businesses can add categories and items with prices directly to their profile.",
  },
  {
    question: "How long is the included service?",
    answer: "Your package includes 1 year of platform access and support.",
  },
  {
    question: "What happens if business information changes?",
    answer:
      "Just update your profile — the same NFC card keeps working, pointing to your always up-to-date profile.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-brand-offwhite">
          Frequently asked questions
        </h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-brand-offwhite"
                >
                  {faq.question}
                  <span className={`ml-4 text-brand-lime transition-transform ${isOpen ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-sm leading-relaxed text-brand-offwhite/70">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
