# AI Search Readiness Scan

Public route: `/ai-search-readiness-scan/`. Featured using the existing Free tool card on `/ai-lab/`, and included in the existing sitemap. Shared navigation, contact, branding and other tool pages are unchanged.

## Architecture and scoring

The Node.js scan API validates a public URL and optional target topic/question. It reuses `content-briefing/sources.ts:fetchPage`, the installed Cheerio parser, `friction-scan/controls.ts` request guards, Redis REST transport and quotas, and the existing structured-output `content-briefing/workflow.ts:callModel` transport. The shared model function has optional task configuration; existing briefing callers retain their defaults. No dependencies were added.

`src/lib/ai-search-readiness/config.ts` holds the seven weights, factor-specific rubrics, technical allocations and thresholds, priority multiplier and scoring bands. The weights are 15/15/20/15/15/10/10, totalling 100. Six content factors receive constrained ordinal grades from 0 to 4. Server code scales each grade to its configured weight, displays factor points to one decimal and rounds the overall sum to an integer. These are diagnostic judgements, not measured probabilities. The seventh factor is computed without a model.

Deterministic extraction records the final public response, title, all H1 counts, bounded heading list, canonical, generic and named robots meta directives, X-Robots-Tag, extractable main-content length, JSON-LD, observable author/date metadata and link text/destinations. Scripts and hidden markup are removed from readable evidence after structured-data extraction. Main/article content is preferred, with bounded header/footer identity context. Password pages, recognised access challenges and fewer than 80 extractable main-content characters fail without a score. Short content and truncation produce visible uncertainty. The first 30,000 text characters are analysed.

Technical points: public response 2; generic indexing/crawl directives 3; meaningful title 1; one non-empty H1 1; extractable content 2; valid canonical 1. Structured data informs applicable trust/authorship assessment rather than earning an automatic bonus. Unknown robots.txt rules receive partial directive credit and a warning. Invalid or oversized JSON-LD blocks are reported, not interpreted as absent expertise. This is not a full schema validator or JavaScript renderer.

The robots.txt request uses the same secured fetcher and shared 12-second reading deadline. The diagnostic checks generic User-agent:* rules, path specificity, Allow ties, wildcard/end markers and percent-encoded unreserved characters. Non-ASCII robots files, unavailable files and cross-origin robots redirects return uncertainty. The fetcher's existing maximum of three redirects is retained, not expanded to impersonate a standards-complete crawler. Named crawler directives are observed but not applied as generic restrictions. No proprietary AI crawler behaviour or real AI search citation is inferred. See the [Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html).

The six-factor model response requires strict JSON Schema output and Zod validation. Each factor includes an exact page quotation, observation, relevance, action, explicit uncertainty, material impact and implementation effort. Quote provenance uses the existing conservative typography normalisation. Fabricated quotations, invalid/refused/incomplete responses and recognised affirmative visibility promises fail closed. The claim guard is defensive pattern matching, not a semantic proof of correctness; live output needs human quality review. Prompt instructions prohibit visibility predictions, invented technical observations, keyword stuffing and following instructions embedded in user input or fetched content. A matching quote proves provenance, not factual truth or the validity of a recommendation.

The structured response also requires an assessability decision. A reported app shell, access challenge, garbled text or uninterpretable page is rejected without accepting a score, even if it passed the minimum text-length check.

The model request uses the existing friction credentials with briefing fallback, strict output, `store:false` and a 55-second deadline. Set `AI_SEARCH_READINESS_TEMPERATURE=0` only where the configured model supports temperature; otherwise leave it blank. Sampling stability depends on the provider/model and is not guaranteed. The full scan has a 90-second function duration and an 85-second browser deadline.

Weakest factor is selected by the lowest earned fraction, with stable configuration-order ties. Top three priorities prefer assessed material impact, then weighted point deficit, so a minor missing canonical does not automatically outrank a major evidence gap. Quick wins and strategic opportunities are independently selected from justified improvements, up to three each; empty lists explicitly acknowledge when no additional change was confidently prioritised.

## Gate, storage, privacy and delivery

The scan stores the validated report, not raw HTML or extracted source text, under a random UUID in shared Redis for 30 minutes. The browser receives only that opaque capability token and the ungated seven-score preview plus its weakest-factor explanation/action. The complete report is not returned before a valid email submission. Browser state is held in React memory, not local/session storage or a public report URL.

Email submission atomically binds the UUID to an HMAC-hashed recipient, timestamp and optional company. Recipient/company binding is immutable across retries. The report and submission metadata expire at 30 days from the first gate submission, not a sliding retention window. Delivery state expires at that same deadline. Raw submission email addresses are never written to Redis and are used only transiently for transactional delivery. Hashes are pseudonymous identifiers, not anonymous data. URLs, topic and report findings may contain public-page information; provider retention policies still apply.

The gate returns the full report immediately after binding. Next.js `after()` sends the branded report and Andy's private notification through the existing `EmailProvider`/Resend transport without blocking report access. A short Redis delivery lock prevents concurrent sends; stable message bodies and separate idempotency keys permit safe retries after either delivery fails. The company in lead notifications comes from the first binding, not retry input. Both provider requests must succeed before the state becomes sent. Resend acceptance does not establish inbox arrival; check delivery/bounce events.

Retries are limited to 23 hours from the first gate submission, safely within [Resend's 24-hour idempotency window](https://resend.com/docs/dashboard/emails/idempotency-keys). Do not change sender/provider/template configuration during pending retries. There is no new durable queue: a terminated invocation or partial failure is shown as failed or unconfirmed and the visitor can retry while the full report remains visible. The browser polls only delivery status; status requests do not send email or expose report content. Closing the browser does not cancel already scheduled server-side delivery. No marketing subscription API is called and no subscription control is introduced.

## Security

Preserved: HTTP(S) only, no URL credentials/non-standard ports, all DNS answers must be public, validated address pinned to the socket to prevent rebinding, redirect destinations revalidated, three-redirect maximum, 12-second reading deadline, 2 MB response cap, supported content-type checks and safe client errors. The shared fetcher additionally rejects localhost names explicitly, validates MIME types as whole media types and exposes typed fetch failure codes for clearer readiness errors. Existing tool callers retain their response/error handling.

Shared Redis quotas have independent readiness namespaces: five scans and ten unlock/retry requests per trusted client per hour, 100 readiness scans per day site-wide, and 120 bounded delivery-status requests per hour. Failed/cancelled scans consume capacity. Redis failure closes the APIs. Vercel's overwritten client-IP header is trusted; non-Vercel hosts retain the existing conservative shared local bucket. IPs and recipient identifiers are HMAC hashed using the existing server secret. JSON/content-type, bounded body sizes and origin checks are reused. API responses are private/no-store/noindex. Application logs contain only fixed delivery failure codes, never input, addresses, report bodies or provider payloads. Email HTML escapes all untrusted content.

## Setup and live checks

1. Use the existing shared model, Upstash Redis, secret and verified Resend settings documented in `docs/website-friction-scan.md`. The new flag is independent: set `AI_SEARCH_READINESS_ENABLED=true` only in a configured deployment. The friction and briefing enable flags do not enable this scan.
2. Keep the new flag disabled in Production initially. Deploy a preview and confirm function durations support 90 seconds for scans and 60 seconds for report/email work, including `after()` execution.
3. Scan representative public pages you control. Review all quotations, page-specific recommendations, contextual relevance of authorship/evidence and scoring consistency. Check short content, noindex, robots blocks, redirects, JavaScript-heavy pages, invalid/unsupported/private URLs and provider failure. Confirm that no result is accepted for unreadable content.
4. Submit an inbox you control. Verify full in-browser access before delivery completes, both Resend requests and actual inbox arrival, private lead fields, retry after partial failure, no duplicate emails and no marketing subscription. Inspect Redis expiry and confirm no raw submission email or HTML/source text is stored.
5. Enable Production only after those checks. Use existing provider spending limits and deployment monitoring. Automated checks use mocked providers and never spend live model credits or send real email.

## Files

New: `src/app/ai-search-readiness-scan/{page.tsx,tool.tsx,scan.module.css}`, `src/app/api/ai-search-readiness-scan/route.ts`, `src/app/api/ai-search-readiness-scan/report/route.ts`, `src/lib/ai-search-readiness/{config.ts,schema.ts,analysis.ts,server.ts,email.ts}`, `tests/e2e/readiness-{fixture.ts,server.spec.ts,scan.spec.ts,http.spec.ts,provider-preload.mjs}` and this document.

Updated: shared fetching/model/controls files named above, `src/app/ai-lab/page.tsx`, `src/lib/site.ts`, `.env.example`, `README.md`, and the existing AI Lab test for the fourth card.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm run build`, then `npm run test:e2e`. Tests cover weights/bands, weakest selection, material prioritisation, optional topic, quote provenance, rejected visibility promises/model failures, deterministic extraction, generic robots, shared SSRF pinning and redirect revalidation, request guards, separate quotas, retention, hashed binding, report/lead rendering, idempotent partial-delivery retries, ungated preview, immediate unlock, status failure/retry, mobile flow, 320px enlarged text, axe checks and AI Lab links. Existing friction, workflow diagnostic and briefing suites exercise the reused shared infrastructure.

The viewport-independent HTTP integration test starts an isolated production Next.js process with a test-only provider preload. It exercises the actual scan/report handlers, Next.js `after()` delivery, status polling, partial lead failure/retry, recipient rejection, retention commands, localhost/redirect protection and hourly limits. It is not loaded by production code and introduces no test bypass into application security. The mobile duplicate of this server-only test is intentionally skipped; mobile browser flow is tested separately.

### Results, 16 September 2026

- Production build, lint, TypeScript checks and `git diff --check` passed. No dependencies were added.
- Final relevant regression run: 158 tests, 155 passed, two intentionally skipped and one failed. All 41 executed new readiness tests passed, including the production-handler integration. Existing Website Friction Scan, Content Workflow Diagnostic, Content Briefing and AI Lab suites passed.
- The remaining failure is on the unchanged Work page: axe samples text part-way through its existing reveal animation at contrast ratios of 4.41 to 4.44. No Work code or tests were changed.
- The earlier whole-site run also found stale Ways to work assertions: the tests expect the former fractional-strategy CTA and 22 list items, while the existing page uses fractional-support copy and six list items. Those unrelated pages and assertions were left unchanged. The readiness HTTP harness startup issue found in that run was corrected and passed the final run.
- Visually reviewed desktop and mobile AI Lab cards, form, ungated score/email gate, full report, individual factor detail, 320px enlarged text and report email. Readiness axe checks passed.
- Read-only live production checks returned HTTP 200 for AI Lab and the three existing tools at their actual routes. No live scans, model requests or emails were submitted. The new tool is not deployed, and its enable flag defaults to false. Real model quality, deployment function execution, Upstash retention and Resend inbox delivery still require the controlled preview checks above.
