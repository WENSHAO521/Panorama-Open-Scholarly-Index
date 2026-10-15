import type { Metadata } from "next";

const SITE_URL = "https://posi.panorama-sg.com";
// opengraph-image.tsx stays at the root of app/ so its address /opengraph-image does not change; with no
// root layout above the language groups it is no longer inherited, so the pages name it here.
const SOCIAL_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Panorama Open Scholarly Index", type: "image/png" };

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
    images: [SOCIAL_IMAGE],
  },
  twitter: { card: "summary_large_image", title: "Panorama Open Scholarly Index (POSI)", description: SITE_DESCRIPTION, images: [SOCIAL_IMAGE] },
};

// Light by default; dark only when the visitor picks the moon (see styles/posi-tokens.css and ThemeToggle).
export const siteViewport = {
  colorScheme: 'light',
  themeColor: '#f8f6f0',
}
