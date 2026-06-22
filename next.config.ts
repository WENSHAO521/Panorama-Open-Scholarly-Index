import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",      // build to out/ for CF Pages static hosting
  trailingSlash: true,   // /article/doi/ instead of /article/doi
  images: { unoptimized: true },
};

export default nextConfig;
