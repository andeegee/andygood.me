# andygood.me

Andy Good's website. Strategy and brand guidance lives in `docs/brand/`. Read `AGENTS.md` and those files before material changes.

## Stack and local development

Next.js App Router, React, strict TypeScript, CSS tokens, npm and Node.js 24 LTS. Instrument Sans is bundled from Fontsource and self-hosted by `next/font/local`, with one preloaded Latin variable WOFF2. There are no browser requests to a font provider and no remote font fetch during builds.

The font licence is included in `public/fonts/OFL.txt`. ESLint 9 is pinned because the React, accessibility and import plugins bundled with the current Next.js configuration do not yet declare ESLint 10 compatibility. Revisit that tooling version when those peer dependencies support it.

```sh
npm ci
npm run dev
```

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts the production server on port 3000. Stop any other server using that port first. It checks every route at desktop and mobile sizes, WCAG A/AA automated rules, navigation, keyboard access, narrow screens with enlarged text, metadata, crawl files, structured data, internal links, redirects and 404s. Screenshots and failure traces go to ignored `test-results/`.

## Routes

- `/`
- `/work/`
- `/work-with-me/`
- `/work-with-me/content-messaging-conversion/`
- `/work-with-me/fractional-content-ai-strategy/`
- `/work-with-me/ai-enabled-content-systems/`
- `/ai-lab/`
- `/website-friction-scan/`
- `/ai-lab/content-briefing/` (internal, noindex)
- `/insights/`
- `/insights/[article]/`
- `/about/`
- `/contact/`

Public page content is server-rendered or prerendered. Insight routes use `generateStaticParams` and reject unknown slugs with 404s. Do not turn arbitrary incoming slugs into pages.

## Components and design

`src/app/globals.css` defines the approved six colours, variable typography, spacing, readable widths, responsive navigation and interaction treatments. `src/components/` contains the header, footer, page and offer shells, container, section, action link, button and placeholder primitives. Page content stays in Server Components; client boundaries are limited to the navigation, approved motion and interactive tools. The mobile menu is a disclosure with `aria-expanded`, normal tab order, Escape handling and closure after navigation; it is not a modal.

The header and footer use Andy's supplied and approved logo as a home link. `SiteLogo` frames the square original using CSS and serves optimised versions through `next/image`; the original PNG is preserved in `public/brand/`. The offer names are taken from the approved offers document and displayed in sentence case. No case studies, claims, results, testimonials, client identities or contact details have been invented. No content backend, analytics or form handler is included.

## SEO and launch controls

`src/lib/metadata.ts` centralises unique titles, descriptions, canonical URLs, Open Graph and X summary metadata. `src/lib/site.ts` is the canonical origin and navigation source. Canonicals use `https://andygood.me` and trailing slashes. JSON-LD connects the website, Andy, services, article authorship and breadcrumbs. A social image is omitted pending an approved asset; there is no invented logo or generic image.

Production builds are indexable by default and Vercel previews remain noindex. Set `SITE_INDEXABLE=false` only for an emergency crawl/indexing pause. The sitemap lists every public canonical page and excludes the internal content-briefing tool. Search indexing controls are not access control.

## Deployment

Use the Next.js preset, repository root, Node.js 24, `npm ci`, and `npm run build`. Leave the output directory at the preset default. Ensure the production environment does not override `SITE_INDEXABLE` to `false`.

Manage search verification and sitemap submission in Google Search Console and Bing Webmaster Tools. Add verified profile URLs to Person `sameAs` and an approved social preview image when those assets are available. Core Web Vitals need field validation on the deployed site with real traffic.
