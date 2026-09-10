# Website Friction Scan

Public route: `/website-friction-scan/`. No navigation or existing approved copy changes. The content briefing tool is unchanged.

## Architecture

The Node.js scan endpoint validates a public HTTP(S) URL, page goal and optional audience. It reuses `content-briefing/sources.ts:fetchPage` without modifying it: DNS addresses are validated and pinned to the socket, including each redirect, blocking private networks and DNS rebinding. Credentials and non-standard ports are rejected. Fetches have a 12-second deadline, a 2 MB response limit and at most three redirects. Only HTML/plain text is accepted. The existing fetcher's identifying ContentBriefing user agent is retained.

The scan-specific Cheerio extraction preserves readable navigation, headings, links, button and form labels because they matter to conversion. Scripts, styles and hidden markup are excluded. Password forms and fewer than 80 readable characters are rejected. Pages under 500 characters get a caution; the first 30,000 characters of long pages are analysed with a visible truncation warning. This does not execute JavaScript or inspect screenshots, interactions or performance. CSS-only hidden text and bot challenge pages cannot always be reliably distinguished from other server HTML. Blocked responses fail without invented content.

A single server-side OpenAI-compatible structured-output call follows the briefing system's request pattern, with independent task instructions and optional separate environment configuration. It cannot directly reuse the briefing model function because that function embeds briefing-specific system instructions and configuration. `store: false` is sent. Zod checks the response, exact quotations are checked against the extracted source, and the full report body is capped at 1,200 words. Quotation matching proves textual provenance, not the truth of a claim or correctness of the interpretation. The immediate result and full report derive from the same validated analysis.

Only the preview is returned in readable form. The full report is AES-256-GCM encrypted in a 30-minute token held in React memory. It is not saved to local storage, a report database or a public URL. After an email request, the server authenticates/decrypts the token and renders a concise branded HTML/plain-text email. Instrument Sans is requested in HTML email; clients that block web fonts use a sans-serif fallback.

Resend sits behind an `EmailProvider` interface. Both report and private lead notification are required for a successful response. Stable idempotency keys and stable message bodies allow retrying either delivery without duplicate sends. A report token is bound to one recipient, preventing reuse for multiple addresses. Provider acceptance is not proof of inbox arrival; inspect delivery/bounce events in Resend. There is no permanent background queue: a partial failure asks the visitor to retry while the token remains valid. The original diagnosis stays visible.

Upstash Redis stores only HMAC-hashed rate-limit identifiers, counters and a hashed recipient binding with request timestamp. No page content, report, URL, raw IP address or raw recipient email is stored there. Counters expire after one hour (100-scan site-wide capacity after 24 hours); bindings expire after one hour. Five scans and ten email attempts per client per hour are allowed. Vercel's platform-controlled `x-vercel-forwarded-for` supplies the address. Other hosts share a conservative `local` bucket until a trusted proxy integration is added. These controls work across Vercel instances and fail closed if Redis is unavailable. Aborted/failed scans still consume capacity.

The user can cancel extraction/model requests and client duplicate submissions are blocked. Independent API requests remain subject to distributed quotas. Origin and JSON/body-size checks protect the endpoints. All responses are private/no-store/noindex. Inputs, page text and report bodies are not logged by the application. Model/email providers process the data required for their service; their own retention policies still apply. Disabling model storage is not a promise of zero provider retention. Email consent is the exact scan-specific wording supplied in the brief.

## Setup before live testing

1. Create a Resend account and add a sending domain/subdomain under your control. Publish the DNS records Resend supplies and wait for verification. Create a sending API key. Set `RESEND_API_KEY` and `FRICTION_SCAN_FROM_EMAIL` to a verified sender, for example `Andy Good <scan@your-verified-domain>`. Set `FRICTION_SCAN_LEAD_EMAIL` to Andy's chosen private inbox. No private address is hardcoded. Configure this sender consistently while retrying pending scans.
2. Create an Upstash Redis database. Copy its HTTPS REST URL and REST token to `FRICTION_SCAN_REDIS_URL` and `FRICTION_SCAN_REDIS_TOKEN`. A separate database is recommended for clear ownership and deletion.
3. Configure a provider/model supporting strict JSON Schema Chat Completions output. Set `FRICTION_SCAN_API_KEY`, `FRICTION_SCAN_MODEL` and optionally `FRICTION_SCAN_BASE_URL`. If omitted, the scan reuses `CONTENT_BRIEFING_API_KEY`, `CONTENT_BRIEFING_MODEL` and `CONTENT_BRIEFING_BASE_URL`. The briefing tool's enable flag has no effect on the scan. Confirm the provider supports `store: false` and `max_completion_tokens`.
4. Generate a secret locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Put the output only in `FRICTION_SCAN_TOKEN_SECRET`. Do not commit or share it. Rotation invalidates outstanding reports.
5. In Vercel project Settings > Environment Variables, add these server-only values to the intended environment. Do not use `NEXT_PUBLIC_` names. Initially use Preview and keep Production disabled. Set `FRICTION_SCAN_ENABLED=true` only in the configured environment, then redeploy. The scan function requests 90 seconds and email 60 seconds; check that the project's function duration supports these limits.
6. Open `/website-friction-scan/` on the deployment. Scan a public page you control, confirm source quotes, and request the report using a test inbox you control. Confirm both the report and Andy's notification in Resend and the inboxes. Check HTML/plain-text formatting, spam placement and a retry after failure. Automated tests use fixtures/mocked providers and do not spend live AI credits or send real email.
7. Repeat with a short page, a redirect, a long page, an inaccessible URL and a mobile viewport. Review output quality against the source before enabling Production. Set provider spending alerts/limits and, if appropriate, Vercel Firewall limits in addition to application quotas. Promote the same settings to Production and redeploy once checked.
8. Leave `SITE_INDEXABLE` under the existing launch policy. This route follows the shared metadata rule: indexable only when `SITE_INDEXABLE=true` and the build is not a Vercel preview. It is not added to navigation. No public report URLs exist.

## Outstanding site decision

The requested closing link points to `/contact/`, which currently contains placeholder copy and no approved contact method. The scan does not alter it. Andy must supply/approve that contact content separately for the deeper-look CTA to convert enquiries.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm run build`, then `npm run test:e2e`. Tests cover server schemas, extraction/fetch boundaries, evidence rejection, token expiry/tampering, model errors, delivery/retry/notification, rate limiting and request guards. Browser tests cover form validation, mocked loading/cancellation/result/email failure/retry, desktop/mobile/320px and axe accessibility. Live provider deliverability and qualitative model judgement require the setup and live checks above.

Provider references: [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [Upstash REST API](https://upstash.com/docs/redis/features/restapi).

## Implementation verification, 10 September 2026

- Lint, typecheck and production build passed.
- All 32 scan-specific desktop/mobile tests passed, including axe checks and 320px layouts. Desktop and narrow result screenshots were visually inspected.
- Full regression run: 98 passed, one existing intentional mobile screenshot skip, one intermittent desktop focus assertion in the untouched content briefing tool. That single assertion passed on an isolated rerun (and had passed in the earlier run). No briefing files were changed.
- Live HTTP and HTTPS fetches of example.com passed. A real redirect through httpbin.org to example.com passed with the final public URL returned.
- Real AI output quality, Resend inbox delivery and Vercel/Upstash credentials have not been live-tested. Complete the setup above before enabling the public scan.
