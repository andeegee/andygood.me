export const site = {
  name: "Andy Good",
  url: "https://andygood.me",
  locale: "en_GB",
  language: "en-GB",
  description: "Senior Content & AI Strategist helping SaaS and technology teams improve messaging, content performance, conversion and AI-enabled content systems.",
} as const;

export const isIndexable =
  process.env.NODE_ENV === "production" &&
  process.env.SITE_INDEXABLE !== "false" &&
  (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");

export const navigation = [
  { href: "/work/", label: "Work" },
  { href: "/work-with-me/", label: "Ways to work" },
  { href: "/ai-lab/", label: "AI Lab" },
  { href: "/insights/", label: "Insights" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
] as const;

// Names come from docs/brand/03_OFFERS.md, displayed in sentence case.
export const offers = [
  { slug: "content-messaging-conversion", title: "Content, messaging & conversion strategy" },
  { slug: "fractional-content-ai-strategy", title: "Fractional content & AI strategy" },
  { slug: "ai-enabled-content-systems", title: "AI-enabled content systems" },
] as const;

export const launchPaths = [
  "/",
  ...navigation.map(({ href }) => href),
  ...offers.map(({ slug }) => `/work-with-me/${slug}/`),
  "/website-friction-scan/",
  "/insights/ai-seo-geo-aeo-2026/",
  "/insights/b2b-saas-landing-page-not-converting/",
  "/insights/fractional-content-strategist/",
  "/insights/ai-content-systems/",
];
