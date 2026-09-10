import { test, expect } from "@playwright/test";
import { inputSchema, emailSchema, reportSchema } from "../../src/lib/friction-scan/schema";
import { analyse, checkReport, extractPage } from "../../src/lib/friction-scan/analysis";
import { seal, unseal } from "../../src/lib/friction-scan/token";
import { deliver, renderReport, resend, type EmailProvider } from "../../src/lib/friction-scan/email";
import { fingerprint, rateLimit, redis } from "../../src/lib/friction-scan/controls";
import { report, scanInput, sourceText } from "./friction-fixture";

test("scan input and email validation reject missing, malformed, unsafe and excessive values", () => {
  expect(inputSchema.safeParse(scanInput).success).toBe(true);
  for (const url of ["no-url", "file:///secret", "ftp://example.com", "https://user:pass@example.com", "https://example.com:8080"]) expect(inputSchema.safeParse({ ...scanInput, url }).success).toBe(false);
  for (const goal of ["", "  ", "x".repeat(501)]) expect(inputSchema.safeParse({ ...scanInput, goal }).success).toBe(false);
  for (const email of ["", "wrong", "a@", "a\r\nb@example.com"]) expect(emailSchema.safeParse({ email, token: "x".repeat(30) }).success).toBe(false);
  expect(emailSchema.parse({ email: " Visitor@Example.com ", token: "x".repeat(30) }).email).toBe("visitor@example.com");
  expect(reportSchema.safeParse({ ...report, frictionPoints: report.frictionPoints.slice(0, 2) }).success).toBe(false);
  expect(reportSchema.safeParse({ ...report, status: "90" }).success).toBe(false);
});

test("extraction keeps CTA/header text, removes hidden scripts, follows final URL and warns on short/long pages", async () => {
  const page = await extractPage(scanInput.url, new AbortController().signal, async () => ({ url: "https://example.com/final", type: "text/html", body: `<html><head><title>Payroll</title></head><body><header>Header proposition</header><main><h1>${sourceText}</h1><button>Book a demo</button><script>secret script</script><p hidden>hidden claim</p></main></body></html>` }));
  expect(page.text).toContain("Header proposition"); expect(page.text).toContain("Book a demo");
  expect(page.text).not.toContain("secret script"); expect(page.text).not.toContain("hidden claim");
  expect(page.url).toBe("https://example.com/final"); expect(page.warnings.join(" ")).toContain("redirected");
  expect(page.warnings.join(" ")).toContain("very little");
  const long = await extractPage(scanInput.url, new AbortController().signal, async (url) => ({ url, type: "text/plain", body: sourceText.repeat(1000) }));
  expect(long.text).toHaveLength(30000); expect(long.warnings.join(" ")).toContain("30,000");
});

test("empty, private, inaccessible, timed-out and sign-in pages fail before analysis", async () => {
  for (const body of ["", "<p>Hi</p>", `<input type="password"><p>${sourceText}</p>`]) await expect(extractPage(scanInput.url, new AbortController().signal, async (url) => ({ url, type: "text/html", body }))).rejects.toThrow();
  for (const reason of ["403 blocked", "404", "TimeoutError", "Too many redirects"]) await expect(extractPage(scanInput.url, new AbortController().signal, async () => { throw new Error(reason); })).rejects.toThrow("could not read");
  await expect(extractPage("http://127.0.0.1", new AbortController().signal)).rejects.toThrow("could not read");
});

test("every observation must carry a matching page quote", () => {
  expect(checkReport(structuredClone(report), sourceText)).toEqual(report);
  const forged = structuredClone(report); forged.visibility.recommendedImprovement.quote = "An invented piece of evidence";
  expect(() => checkReport(forged, sourceText)).toThrow("verify");
});

test("structured model pipeline rejects errors, refusal, truncation, invalid schema and invented evidence", async () => {
  const original = globalThis.fetch;
  const env = { ...process.env };
  process.env.FRICTION_SCAN_BASE_URL = "https://api.example.com/v1";
  process.env.FRICTION_SCAN_MODEL = "fixture-model";
  process.env.FRICTION_SCAN_API_KEY = "fixture-secret";
  const page = { text: sourceText, url: scanInput.url, warnings: [] };
  try {
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("fixture-model"); expect(body.store).toBe(false); expect(body.response_format.json_schema.strict).toBe(true);
      expect(body.messages[0].content).toContain("untrusted DATA");
      return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(report) } }] });
    };
    expect(await analyse(scanInput, page, new AbortController().signal)).toEqual(report);
    const forged = structuredClone(report); forged.fixFirst.quote = "Invented source evidence";
    for (const response of [new Response("failed", { status: 500 }), Response.json({ choices: [{ finish_reason: "length", message: { content: "{}" } }] }), Response.json({ choices: [{ finish_reason: "stop", message: { refusal: "no" } }] }), ...["invalid", "{}", JSON.stringify(forged)].map((content) => Response.json({ choices: [{ finish_reason: "stop", message: { content } }] }))]) {
      globalThis.fetch = async () => response;
      await expect(analyse(scanInput, page, new AbortController().signal)).rejects.toThrow();
    }
  } finally { globalThis.fetch = original; process.env = env; }
});

test("private tokens authenticate, expire and contain no readable report", () => {
  const env = { ...process.env }; const now = Date.now;
  process.env.FRICTION_SCAN_TOKEN_SECRET = "a".repeat(64);
  try {
    const token = seal({ input: scanInput, url: scanInput.url, warnings: [], report });
    expect(token).not.toContain("Payroll"); expect(unseal(token).report).toEqual(report);
    const tampered = Buffer.from(token, "base64url"); tampered[40] ^= 1;
    expect(() => unseal(tampered.toString("base64url"))).toThrow("expired");
    Date.now = () => now() + 31 * 60 * 1000;
    expect(() => unseal(token)).toThrow("expired");
  } finally { process.env = env; Date.now = now; }
});

test("branded report escapes untrusted HTML and includes all sections and closing CTA", () => {
  const rendered = renderReport({ id: "test", expires: 0, created: "2026-09-10T00:00:00Z", input: { ...scanInput, goal: "<script>alert(1)</script>" }, url: scanInput.url, warnings: [], report });
  for (const title of ["Executive summary", "Clarity", "Trust & proof", "Conversion", "Search & AI visibility", "Priority fixes", "What I’d fix first", "Closing note"]) expect(rendered.text).toContain(title);
  expect(rendered.html).not.toContain("<script>"); expect(rendered.html).toContain("&lt;script&gt;");
  expect(rendered.html).toContain("https://andygood.me/contact/"); expect(rendered.html).toContain("Instrument Sans");
});

test("report and lead delivery retry with stable keys/content and bind one recipient", async () => {
  const env = { ...process.env };
  Object.assign(process.env, { RESEND_API_KEY: "test", FRICTION_SCAN_FROM_EMAIL: "scan@example.com", FRICTION_SCAN_LEAD_EMAIL: "owner@example.com", FRICTION_SCAN_TOKEN_SECRET: "b".repeat(64) });
  const data = { id: "test-id", expires: Date.now() + 10000, created: "2026-09-10T00:00:00Z", input: scanInput, url: scanInput.url, warnings: [], report };
  let binding = "";
  const command: typeof redis = async (args) => { binding ||= String(args[4]); return binding; };
  const calls: { key: string; message: Parameters<EmailProvider["send"]>[0] }[] = [];
  const provider: EmailProvider = { async send(message, key) { calls.push({ key, message }); if (calls.length === 2) throw new Error("Notification unavailable"); } };
  try {
    await expect(deliver(data, "visitor@example.com", provider, command)).rejects.toThrow("Notification");
    await deliver(data, "visitor@example.com", provider, command);
    expect(calls[0]).toEqual(calls[2]); expect(calls[1]).toEqual(calls[3]);
    expect(calls[1].message.to).toBe("owner@example.com");
    for (const value of ["visitor@example.com", scanInput.url, scanInput.goal, scanInput.audience, "Timestamp:"]) expect(calls[1].message.text).toContain(value);
    expect(calls[1].message.text).not.toContain(sourceText);
    await expect(deliver(data, "other@example.com", provider, command)).rejects.toThrow("already linked");
    expect(binding).not.toContain("visitor@example.com");
  } finally { process.env = env; }
});

test("Resend failures do not report success and use idempotency headers", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, init) => { expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("stable-key"); return new Response("failed", { status: 503 }); };
    await expect(resend.send({ to: "visitor@example.com", subject: "Test", text: "Test" }, "stable-key")).rejects.toThrow("Retry");
    globalThis.fetch = async () => Response.json({});
    await expect(resend.send({ to: "visitor@example.com", subject: "Test", text: "Test" }, "stable-key")).rejects.toThrow("confirmed");
  } finally { globalThis.fetch = original; }
});

test("distributed quotas hash identifiers and fail closed", async () => {
  const original = globalThis.fetch; const env = { ...process.env };
  Object.assign(process.env, { FRICTION_SCAN_REDIS_URL: "https://redis.example.com", FRICTION_SCAN_REDIS_TOKEN: "test", FRICTION_SCAN_TOKEN_SECRET: "c".repeat(64), VERCEL: "1" });
  const request = new Request("https://andygood.me/api/website-friction-scan/", { headers: { "x-vercel-forwarded-for": "203.0.113.7" } });
  try {
    globalThis.fetch = async (_url, init) => { expect(String(init?.body)).not.toContain("203.0.113.7"); return Response.json({ result: 6 }); };
    await expect(rateLimit(request, "scan")).rejects.toThrow("hourly");
    expect(fingerprint("test")).toHaveLength(64);
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });
    await expect(rateLimit(request, "email")).rejects.toThrow("unavailable");
  } finally { globalThis.fetch = original; process.env = env; }
});

test("public API validates input, origin and content size without configured providers", async ({ request }) => {
  const path = "/api/website-friction-scan/";
  expect((await request.post(path, { data: { ...scanInput, url: "wrong" } })).status()).toBe(400);
  expect((await request.post(path, { data: scanInput, headers: { origin: "https://elsewhere.example" } })).status()).toBe(403);
  expect((await request.post(path, { data: { ...scanInput, goal: "x".repeat(6000) } })).status()).toBe(413);
  const disabled = await request.post(path, { data: scanInput });
  expect(disabled.status()).toBe(503); expect(disabled.headers()["cache-control"]).toContain("no-store");
  expect((await request.post("/api/website-friction-scan/report/", { data: { email: "invalid", token: "x".repeat(30) } })).status()).toBe(400);
});
