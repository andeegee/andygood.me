import type { MetadataRoute } from "next";
import { isIndexable, site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", ...(isIndexable ? { allow: "/" } : { disallow: "/" }) },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
