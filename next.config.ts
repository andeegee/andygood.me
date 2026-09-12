import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/lab/:path*", destination: "/ai-lab/:path*/", permanent: true }];
  },
};

export default nextConfig;
