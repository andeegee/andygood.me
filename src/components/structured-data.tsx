import { site } from "@/lib/site";

type Schema = Record<string, unknown>;

export const personId = `${site.url}/#person`;
export const websiteId = `${site.url}/#website`;

const absoluteUrl = (path: string) => new URL(path, site.url).href;

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: `${site.url}/`,
      name: site.name,
      description: site.description,
      inLanguage: site.language,
      publisher: { "@id": personId },
    },
    {
      "@type": "Person",
      "@id": personId,
      name: "Andy Good",
      url: absoluteUrl("/about/"),
      image: absoluteUrl("/about/andy-good-profile.png"),
      jobTitle: "Senior Content & AI Strategist",
      description: site.description,
      homeLocation: { "@type": "Country", name: "South Africa" },
      knowsAbout: [
        "Content strategy",
        "Copywriting",
        "Messaging and conversion",
        "SaaS and technology content",
        "AI SEO, GEO and AEO",
        "Content operations",
        "AI-enabled content systems",
      ],
    },
  ],
} satisfies Schema;

export function serviceSchema(name: string, description: string, path: string): Schema {
  const url = absoluteUrl(path);
  return {
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    serviceType: name,
    description,
    url,
    provider: { "@id": personId },
    areaServed: [
      { "@type": "Country", name: "South Africa" },
      { "@type": "Country", name: "United Kingdom" },
    ],
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]): Schema {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

export function schemaGraph(...items: Schema[]): Schema {
  return { "@context": "https://schema.org", "@graph": items };
}

export function StructuredData({ data }: { data: Schema }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
