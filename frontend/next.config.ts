import type { NextConfig } from "next";

const apiBackend = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.VITE_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: [
    "192.168.29.4",
    "192.168.29.4:3000",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*/",
        destination: `${apiBackend}/api/:path*/`,
      },
      {
        source: "/api/:path*",
        destination: `${apiBackend}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
