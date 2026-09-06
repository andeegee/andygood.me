# andygood.me

Technical foundation for Andy Good's website. Strategy and brand guidance lives in `docs/brand/`. Read `AGENTS.md` and those files before material changes. Page and metadata placeholders are intentional; this is not launch copy.

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

The browser suite starts the production server on port 3000. Stop any other server using that port first. It checks every route at desktop and mobile sizes, WCAG A/AA automated rules, navigation, keyboard access, narrow screens with enlarged text, metadata, crawl files and 404s. Screenshots and failure traces go to ignored `test-results/`. Tests expect the default `SITE_INDEXABLE=false` foundation state.

## Routes

- `/`
- `/work/`
- `/work/[case-study]/`, currently verified through `/work/placeholder/`
- `/work-with-me/`
- `/work-with-me/content-messaging-conversion/`
- `/work-with-me/fractional-content-ai-strategy/`
- `/work-with-me/ai-enabled-content-systems/`
- `/insights/`
- `/insights/[article]/`, currently verified through `/insights/placeholder/`
- `/about/`
- `/contact/`

All page shells are prerendered. Detail routes use `generateStaticParams` and reject unknown slugs with 404s. The two placeholder slugs are technical fixtures with labelled copy, noindex metadata and no sitemap entries. Replace them with approved content records, metadata and real slugs when available. Do not turn arbitrary incoming slugs into pages.

## Components and design

`src/app/globals.css` defines the approved six colours, variable typography, spacing, readable widths, responsive navigation and interaction treatments. `src/components/` contains the header, footer, page and offer shells, container, section, action link, button and placeholder primitives. Only the header needs a client boundary. The mobile menu is a disclosure with `aria-expanded`, normal tab order, Escape handling and closure after navigation; it is not a modal.

The plain-text name is a home link, not a logo. The offer names are taken from the approved offers document and displayed in sentence case. No case studies, claims, results, testimonials, client identities or contact details have been invented. No content backend, analytics, form handler or decorative assets are included.

## SEO and launch controls

`src/lib/metadata.ts` centralises unique titles, canonical URLs, Open Graph and X summary metadata. `src/lib/site.ts` is the canonical origin and navigation source. Canonicals use `https://andygood.me` and trailing slashes. Descriptions remain labelled placeholders. A social image is omitted pending an approved asset; there is no invented logo or generic image.

The foundation defaults to noindex and a disallow-all robots file. Vercel preview environments remain noindex even if `SITE_INDEXABLE=true`. The sitemap lists the nine approved fixed URLs and excludes technical fixtures. Before launch, replace all placeholders and approve metadata, then explicitly set `SITE_INDEXABLE=true` for production and rebuild. Search indexing controls are not access control.

## Before connecting Vercel

No Vercel project has been created or linked. The repository is ready to import using the Next.js preset, repository root, Node.js 24, `npm ci`, and `npm run build`. Leave the output directory at the preset default. No credentials, database or runtime integrations are required for this foundation. Keep `SITE_INDEXABLE=false` until launch approval.

Before public launch, approve page copy, metadata, real work/article content and slugs, the contact method and any social preview/favicon assets. Decide any content-management or analytics needs separately. Audit existing live URLs and supply a redirect map before replacing the current site. Domain/DNS cutover and public indexing should follow content and launch approval. Core Web Vitals need field validation after real content is added and the site is deployed.
