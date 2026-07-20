import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? "/safa-portfolio" : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  
  // Add empty turbopack config to silence the error
  turbopack: {},
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.postimg.cc",
        port: "",
        pathname: "/**",
      },
    ],
    ...(isPages && { unoptimized: true }),
  },
  ...(isPages
    ? {
        output: "export" as const,
        basePath,
        assetPrefix: basePath,
        trailingSlash: true,
      }
    : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;