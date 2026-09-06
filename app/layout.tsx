import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
