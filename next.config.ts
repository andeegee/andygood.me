import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.andygood.me" }],
        destination: "https://andygood.me/:path*/",
        permanent: true,
      },
      { source: "/lab/:path*", destination: "/ai-lab/:path*/", permanent: true },
    ];
  },
};

export default nextConfig;
