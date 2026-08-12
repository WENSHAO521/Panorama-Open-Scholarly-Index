import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
