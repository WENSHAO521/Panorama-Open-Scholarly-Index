import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",      // build to out/ for CF Pages static hosting
  trailingSlash: true,   // /article/doi/ instead of /article/doi
  images: { unoptimized: true },
  // One root layout per language (src/app/(en), later src/app/zh), so the 404 page is global-not-found.tsx.
  experimental: { globalNotFound: true },
  // Certificate PDFs embed full fonts and the journal directory is large;
  // allow slower static generation than the 60 s default.
  staticPageGenerationTimeout: 300,
};

export default nextConfig;
