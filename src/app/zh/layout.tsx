import type { Metadata } from "next";
import { RootShell } from "@/components/RootShell";
import { OG_LOCALE } from "@/i18n/config";
import { getMessages } from "@/i18n";
import { siteMetadata, siteViewport } from "../site-metadata";

// The Simplified Chinese pages, under /zh/. Only translated pages live here (TRANSLATED_PATHS); links to the rest
// go to the English originals.
const home = getMessages("zh-Hans").home;

export const metadata: Metadata = {
  ...siteMetadata,
  title: { default: home.metaTitle, template: "%s · POSI" },
  description: home.metaDescription,
  openGraph: { ...siteMetadata.openGraph, title: home.metaTitle, description: home.metaDescription, locale: OG_LOCALE["zh-Hans"], url: "/zh/" },
  twitter: { ...siteMetadata.twitter, title: home.metaTitle, description: home.metaDescription },
};
export const viewport = siteViewport;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootShell locale="zh-Hans">{children}</RootShell>;
}
