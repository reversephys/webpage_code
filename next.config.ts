import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/files/:path*',
        destination: 'http://127.0.0.1:8090/api/files/:path*',
      },
    ]
  },
};

export default nextConfig;
