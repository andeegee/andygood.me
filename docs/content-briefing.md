# Content briefing lab v1

The unlisted `/lab/content-briefing` route is an internal working tool. The public pages and navigation are unchanged. Route metadata always specifies noindex, nofollow and nocache, independently of `SITE_INDEXABLE`. The route is dynamically rendered and is absent from the sitemap. The API uses POST and returns private, no-store responses.

## Architecture

- React form with in-memory assignment and draft state. Refresh clears the draft. No database, local storage, authentication or integrations.
- `/api/content-briefing` validates and normalises the assignment with Zod, then collects sources on the server.
- Pasted text has a stable user-supplied source label. Public HTML/plain-text URLs are extracted with Cheerio. No browser execution, cookies, sign-in, uploads, PDF parsing or recursive crawling.
- URL requests validate all resolved IPs, reject non-public addresses, pin the validated address to the connection and revalidate redirects. Only standard HTTP(S) ports are permitted. Three redirects, 12-second fetch deadlines and 2 MB page limits bound source requests.
- Up to five URLs, 40,000 pasted characters, 20,000 extracted characters per page and 5,000 notes characters. URL truncation and failures appear in the source register and review gaps. An entirely unusable source set prevents generation.
- Two server-side OpenAI-compatible Chat Completions calls use strict JSON Schema output plus independent Zod validation. First: source analysis. Second: strategic brief from the checked evidence ledger. Each call has a 60-second timeout and 6,500 completion-token cap. Incomplete/refused/malformed responses fail visibly.
- Source references must match supplied source IDs and verbatim text after whitespace normalisation. Unverifiable references are removed and the finding is downgraded to Needs evidence. Brief proof references must identify source-supported findings. This is traceability checking, not independent fact verification or a guarantee that a quotation entails the model's interpretation. Human review remains essential.
- Search is rendered only when the explicit optional query/search-intent field is populated. Recommendations are provisional, with no keyword stuffing or promised rankings.
- Markdown copy/download includes assignment, brief, classifications, quotations, source register and gaps. Full submitted source bodies are excluded from exports and API results.

## Configuration and live testing

1. Configure the server environment using `.env.example` (locally copy it to `.env.local`).
2. Set `CONTENT_BRIEFING_API_KEY` to the provider credential and `CONTENT_BRIEFING_MODEL` to an available model supporting strict JSON Schema on Chat Completions. The model is deliberately not selected on Andy's behalf.
3. Leave `CONTENT_BRIEFING_BASE_URL=https://api.openai.com/v1` for OpenAI or set the HTTPS API base of an approved compatible provider. Compatibility requires `response_format: json_schema`, `store: false` and `max_completion_tokens` support. See [OpenAI's structured output documentation](https://platform.openai.com/docs/guides/structured-outputs).
4. Set `CONTENT_BRIEFING_ENABLED=true` only when ready. On the deployment platform, add these server environment variables to the intended environment and redeploy. Locally run `npm run dev` after setting them.
5. Open `/lab/content-briefing` directly. Submit a non-confidential assignment with a known source. Check both Evidence and Gaps & decisions against the original material, then copy/download the draft.
6. Repeat with one public URL, multiple URLs and one inaccessible URL. Confirm partial failures remain visible and unsupported claims are not approved as facts.

API keys never enter the client bundle. Application code does not log submissions or provider payloads. Submitted text is sent to the configured provider; its retention and data policies apply. `store: false` is requested, but does not override the provider's policies.

## Deployment boundary and decisions

As requested, v1 has no authentication. Noindex and an unlisted route do not restrict access. Once enabled, anyone who discovers the route/API can submit work and incur model costs. A two-request per-process concurrency cap reduces simultaneous load but is not a distributed rate limit or access control. Andy must choose an approved provider/model and decide whether to enable this unauthenticated tool on the public deployment or keep it in a platform-protected preview/local environment. No application authentication has been added.

The route requests a 180-second server duration. Confirm the deployment plan supports that duration. Client cancellation stops waiting for the result, but a provider request already running may complete and incur cost. Refresh loses the draft; download it before leaving.

## Verification

The default output tab is Summary, followed by Full brief, Evidence and Gaps & decisions. Summary is a presentation-only selection from the existing result: up to five priorities balanced across questions, key points and objections; up to five source-supported findings, preferring proof IDs recommended by the full brief; three gaps spanning clarification, evidence and human decisions; and up to eight outline entries. If the outline is longer, the opening seven and final entry are shown, with a notice directing the reader to the complete outline. No new AI calls, evidence classifications or strength scores are introduced. Long passages expand in place. Copy summary retains the complete text of the selected items; existing full Markdown copy/download and all detailed content remain unchanged.

Summary UX verification: lint, typecheck and production build passed; the full suite completed with 63 passed and one existing skip. Checks include desktop/mobile screenshots, axe accessibility, a 320 px viewport at 200% text size, four-tab keyboard navigation, expandable passages, conditional search, both copy actions, full download and non-mutating summary selection.

Run `npm run lint`, `npm run typecheck`, `npm run build` and `npm run test:e2e`. The briefing browser tests cover desktop/mobile form and result layouts, axe accessibility, keyboard tabs, source display, validation, mocked provider failure, Markdown copy/download, noindex and API boundaries. Server tests exercise the real workflow with deterministic model responses, source extraction, partial failure, public-address restrictions, malformed output, fabricated citations and conditional search. Mocked tests establish implementation behaviour; live provider quality and deployment configuration still require the smoke test above.

Verified on 10 September 2026: lint, typecheck and production build passed. The full Playwright suite completed with 59 passed and one existing mobile work-page test skipped. After the final source-extraction adjustment, all eight server tests passed again. Desktop and mobile screenshots were visually reviewed; the briefing form, brief and evidence views passed axe checks. A real HTTPS fetch of example.com succeeded. No live paid model call was made because provider/model configuration has not been selected.
