import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Self-hosted (not next/font/google) -- that mechanism fetches font files
// from Google Fonts live at build time, and Cloudflare Pages' build
// environment hit a real, deterministic 404 on IBM Plex Sans's pinned URL.
// Vendoring the woff2 files removes the live-network dependency.
const ibmPlexSans = localFont({
  variable: "--font-ibm",
  display: "swap",
  src: [
    { path: "../fonts/ibm-plex-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-sans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ibm-plex-sans-700.woff2", weight: "700", style: "normal" },
  ],
});

const geistMono = localFont({
  variable: "--font-geist-mono",
  display: "swap",
  src: [{ path: "../fonts/geist-mono.woff2", weight: "400 700", style: "normal" }],
});

const SITE_URL = "https://posi.panorama-sg.com";
const SITE_DESCRIPTION =
  "The Panorama Open Scholarly Index (POSI) is a scholarly database published by Panorama Scholarly Group Ltd: publications, journals, journal rankings and certificates of indexing.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Panorama Open Scholarly Index (POSI)",
    template: "%s · POSI",
  },
  description: SITE_DESCRIPTION,
  publisher: "Panorama Scholarly Group Ltd",
  authors: [{ name: "Panorama Scholarly Group Ltd", url: "https://panorama-sg.com" }],
  keywords: ["open database", "journal index", "scholarly journals", "open data", "journal metadata", "citation indicators", "journal rankings", "citation index", "PSC", "provenance"],
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "POSI - Panorama Open Scholarly Index",
    title: "Panorama Open Scholarly Index (POSI)",
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: "Panorama Open Scholarly Index (POSI)", description: SITE_DESCRIPTION },
};

// Light only: keeps browser controls and scrollbars light on dark systems too.
export const viewport = { colorScheme: 'light', themeColor: '#ffffff' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
          style={{ background: 'var(--teal)', color: '#fff' }}
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
