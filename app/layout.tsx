import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Caveat } from "next/font/google";
import "./globals.css";
import { externalBaseUrl } from "@/lib/base-url";
import { SiteFooter } from "./site-footer";

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

/**
 * The on-screen keyboard resizes the LAYOUT: a fixed or sticky element then
 * sits above the keyboard rather than under it, and the page does not jump
 * behind a visual viewport the keyboard has shrunk.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  /**
   * What a relative og:image resolves against. Next's fallback is the
   * per-deployment origin, so a preview would advertise its own host;
   * externalBaseUrl() never reads the Host header and gives the CANONICAL one.
   */
  metadataBase: new URL(externalBaseUrl()),
  title: "ExtraLesson — Practise CSEC Maths the way you’ll sit it",
  description:
    "Photograph your working. ExtraLesson marks it the way a Paper 2 examiner does — every method mark, and the reason for each. Built by a Grenadian island scholar.",
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
        <SiteFooter />
      </body>
    </html>
  );
}
