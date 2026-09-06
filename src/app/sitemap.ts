import type { MetadataRoute } from "next";
import { launchPaths, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Placeholder detail pages are deliberately excluded. Add approved records here.
  return launchPaths.map((path) => ({ url: new URL(path, site.url).href }));
}
