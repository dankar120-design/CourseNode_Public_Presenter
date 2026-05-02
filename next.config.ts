import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.trycloudflare.com",
        "*.pinggy-free.link",
        "*.pinggy.link",
        "localhost:3000"
      ]
    }
  }
};

export default nextConfig;
