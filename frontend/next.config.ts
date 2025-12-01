import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      // Development: localhost
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8080",
      },
      // Production: Allow all HTTPS origins
      {
        protocol: "https",
        hostname: "**",
      },
      // Production: Allow all HTTP origins (for Docker internal network)
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    // Only use unoptimized in development to allow localhost images
    // In production, images will be optimized normally
    unoptimized: isDevelopment,
  },
};

export default nextConfig;
