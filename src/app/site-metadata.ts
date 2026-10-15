import type { Metadata } from "next";

const SITE_URL = "https://posi.panorama-sg.com";
const SITE_DESCRIPTION =
  "The Panorama Open Scholarly Index (POSI) is a scholarly database published by Panorama Scholarly Group Ltd: publications, journals, journal rankings and certificates of indexing.";

export const siteMetadata: Metadata = {
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

// Light and dark: the page follows the visitor's choice or, by default, the OS (see styles/posi-tokens.css).
export const siteViewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f6f0' },
    { media: '(prefers-color-scheme: dark)', color: '#17231f' },
  ],
}
