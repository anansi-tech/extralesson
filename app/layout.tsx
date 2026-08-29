import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Caveat } from "next/font/google";
import "./globals.css";
import { externalBaseUrl } from "@/lib/base-url";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "800", "900"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  /**
   * WHAT A RELATIVE og:image RESOLVES AGAINST.
   *
   * Without it Next falls back to the deployment origin and warns at build.
   * That happens to produce the right absolute URL on Vercel, so the tag has
   * been correct — but it is correct by accident, and the fallback is a
   * per-deployment value, so a preview build would advertise its own
   * *.vercel.app host to anyone who shared that link.
   *
   * externalBaseUrl() rather than a second copy of the domain: it already
   * prefers configuration over the platform, already refuses to hand out a
   * localhost link in production, and already declines to read the request's
   * Host — which is the header an attacker controls.
   *
   * It must be the CANONICAL host. The apex 308s to www, and a scraper that
   * does not follow redirects gets fifteen bytes of text/plain.
   */
  metadataBase: new URL(externalBaseUrl()),
  title: "ExtraLesson — Your own CXC examiner",
  description:
    "AI-powered CSEC Maths tutoring that marks the way examiners award marks — step by step. Built by a Grenadian island scholar.",
  /**
   * Which URL this page IS. Absent, a scraper that arrived at the apex and
   * followed the 308 has nothing telling it the canonical address, and a
   * share of the apex is the share most likely to be made.
   */
  openGraph: { url: '/', type: 'website' },
  alternates: { canonical: '/' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${plexMono.variable} ${caveat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
