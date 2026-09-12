# Contact page delivery

`/contact/` posts to `/api/contact/` and reuses the existing Resend adapter.
Messages go to `letschat@andygood.me`, with the prospect's email as Reply-To.

To enable delivery, configure `RESEND_API_KEY` and `FRICTION_SCAN_FROM_EMAIL`
(an address on a verified Resend sending domain) in the deployment environment,
then redeploy. These are the existing email settings in `.env.example`.
Keep `SITE_INDEXABLE=false`. No scan, AI or Redis configuration is needed for contact.

Without email configuration, submissions return an honest availability error and
retain the entered values. Provider acceptance is required before showing success.
Repeated identical submissions reuse the Resend idempotency key. The honeypot
discards populated submissions without sending an email.

Run `npm run lint`, `npm run typecheck`, `npm run build`, then
`npm run test:e2e -- tests/e2e/contact.spec.ts tests/e2e/contact-server.spec.ts`.
Provider tests use mocked responses and send no real email.
