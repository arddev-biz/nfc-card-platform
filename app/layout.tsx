import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

// Variables only — these are attached to <body> but do not change the
// app's default font. The public profile/menu opt in via `font-display`
// and `font-body`; admin and marketing keep the system sans.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "NFC Card Platform",
  description: "NFC business cards connected to personalized digital business profiles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable}`}>{children}</body>
    </html>
  );
}
