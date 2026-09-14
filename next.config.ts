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
      { source: "/lab", destination: "/ai-lab/", permanent: true },
      { source: "/lab/content-briefing", destination: "/ai-lab/content-briefing/", permanent: true },
    ];
  },
};

export default nextConfig;
