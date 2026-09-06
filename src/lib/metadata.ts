import type { Metadata } from "next";
import { isIndexable, site } from "@/lib/site";

export function pageMetadata(title: string, path: string, description: string, placeholder = false): Metadata {
  const fullTitle = title === site.name ? title : `${title} | ${site.name}`;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    robots: { index: isIndexable && !placeholder, follow: isIndexable && !placeholder },
    openGraph: {
      type: "website",
      locale: site.locale,
      siteName: site.name,
      title: fullTitle,
      description,
      url: path,
    },
    twitter: { card: "summary", title: fullTitle, description },
  };
}
