export const site = {
  name: "Andy Good",
  url: "https://andygood.me",
  locale: "en_GB",
} as const;

export const isIndexable =
  process.env.SITE_INDEXABLE === "true" &&
  (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");

export const navigation = [
  { href: "/work/", label: "Work" },
  { href: "/work-with-me/", label: "Ways to work" },
  { href: "/lab/", label: "Lab" },
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
];
