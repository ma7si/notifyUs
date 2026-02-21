import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from common hosts
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Suppress powered by header
  poweredByHeader: false,
};

export default nextConfig;
