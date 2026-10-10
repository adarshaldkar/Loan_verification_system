import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Built-in reverse proxy rewrite for all API routes
  async rewrites() {
    const backendOrigin =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.BACKEND_URL ||
      "http://localhost:5000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
