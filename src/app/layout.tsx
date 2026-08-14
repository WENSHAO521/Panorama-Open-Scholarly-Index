import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Self-hosted (not next/font/google) -- that mechanism fetches font files
// from Google Fonts live at build time, and Cloudflare Pages' build
// environment hit a real, deterministic 404 on IBM Plex Sans's pinned URL
// (Next.js's bundled font metadata pointed at a file Google Fonts no
// longer serves at that hash), breaking every deploy. Vendoring the actual
// woff2 files (latin subset only, matching the previous subsets: ["latin"]
// config) removes the live-network dependency from the build entirely.
const barlowCondensed = localFont({
  variable: "--font-barlow",
  display: "swap",
  src: [
    { path: "../fonts/barlow-condensed-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/barlow-condensed-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/barlow-condensed-800.woff2", weight: "800", style: "normal" },
  ],
});

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
  "Panorama Open Scholarly Index is an open journal indexing, lifecycle evaluation, subject ranking, and citation analytics infrastructure built on versioned evidence and reproducible methodology.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Panorama Open Scholarly Index",
    template: "%s | POSI",
  },
  description: SITE_DESCRIPTION,
  keywords: ["journal rankings", "journal evaluation", "academic journals", "citation analytics", "journal quartiles", "scholarly index", "open citation metrics", "PSC", "AJR", "PCI"],
  icons: { icon: "/favicon.svg" },
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "POSI — Panorama Open Scholarly Index",
    title: "Panorama Open Scholarly Index",
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Panorama Open Scholarly Index",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${ibmPlexSans.variable} ${geistMono.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ background: "var(--posi-bg)", color: "var(--posi-text)" }}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
