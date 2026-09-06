# Foundation verification

Verified locally on 6 September 2026 using Node.js 24.16.0, npm 11.13.0 and the pinned package lock.

## Results

- Dependency installation completed. npm reported zero vulnerabilities.
- ESLint passed with zero warnings.
- Next.js route type generation and TypeScript checks passed.
- The Next.js 16.3.4 production build passed. All nine fixed page URLs and two placeholder detail URLs were prerendered.
- All 11 page URLs returned 200 at 1440px desktop and 390px mobile widths. Each had one main heading, the expected landmarks, language, canonical URL, Open Graph URL/title and noindex metadata.
- Automated axe checks found no WCAG 2 A/AA or WCAG 2.1 AA violations on the tested pages.
- Desktop and mobile navigation passed, including skip-link focus, active-page state, menu disclosure, Escape focus return and menu closure after navigation.
- A 320px viewport with 200% root text size showed no horizontal overflow, including the longest offer heading and open navigation.
- Sitemap and robots endpoints returned 200. The sitemap contained the nine fixed URLs and excluded the two placeholder detail URLs. Robots disallowed indexing in the default foundation configuration.
- Unknown fixed, offer, work and insight URLs returned 404. Next.js currently logs an internal `NoFallbackError` when rejecting unknown dynamic slugs with `dynamicParams=false`; the tested HTTP responses were still correct 404s.
- Desktop and mobile screenshots of the homepage, ways-to-work page and expanded mobile navigation were inspected. No obvious clipping, overlap or layout issues were found.

The browser suite contains 30 checks across desktop and mobile projects. An initial run began before the browser installation completed and was discarded. The subsequent run passed 29 checks; one test used the old menu-button name after the button changed to “Close menu”. That test locator was corrected and both desktop/mobile navigation checks passed on rerun.

## Scope of verification

Browser testing used Chromium with desktop and emulated mobile viewports. Automated accessibility testing does not replace manual assistive-technology testing. No field Core Web Vitals claim is made: assess those after approved content and real traffic are available. Static rendering, a single 30 KB self-hosted variable font, minimal client code and no third-party scripts provide the performance foundation.

No Vercel project, hosting deployment, domain change, contact integration, tracking or external service was created.
