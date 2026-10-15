import { RootShell } from "@/components/RootShell";
import { siteMetadata, siteViewport } from "../site-metadata";

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootShell locale="en">{children}</RootShell>;
}
