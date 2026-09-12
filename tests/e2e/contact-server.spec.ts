import { test, expect } from "@playwright/test";
import { POST } from "../../src/app/api/contact/route";
import { contactSchema, contactTopics } from "../../src/lib/contact";

const input = { name: "Test Prospect", email: "prospect@example.com", company: "", topic: contactTopics[0], message: "We need clearer messaging.", website: "", submissionId: "d58fa9bd-53ae-4a29-af3f-3fc982826b9b" };
const request = (data: unknown) => new Request("https://andygood.me/api/contact/", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://andygood.me" }, body: JSON.stringify(data) });

test("contact validates input and request boundaries without sending", async () => {
  expect(contactSchema.parse({ ...input, name: "  Test Prospect  " }).name).toBe("Test Prospect");
  expect(contactSchema.parse({ ...input, company: undefined }).company).toBe("");
  for (const changes of [{ name: " " }, { name: "x".repeat(101) }, { email: "bad" }, { email: "a\r\nb@example.com" }, { company: "x".repeat(151) }, { topic: "invented" }, { message: " " }, { message: "x".repeat(5001) }, { submissionId: "bad" }]) {
    expect((await POST(request({ ...input, ...changes }))).status).toBe(400);
  }
  expect((await POST(new Request("https://andygood.me/api/contact/", { method: "POST", body: "{}" }))).status).toBe(415);
  expect((await POST(new Request("https://andygood.me/api/contact/", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
  const crossOrigin = request(input); crossOrigin.headers.set("origin", "https://other.example");
  expect((await POST(crossOrigin)).status).toBe(403);
  expect((await POST(request({ ...input, message: "x".repeat(40001) }))).status).toBe(413);
});

test("contact reuses Resend, ignores honeypot, handles unavailable delivery and retries safely", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
  const calls: { body: Record<string, unknown>; key: string }[] = [];
  try {
    delete process.env.RESEND_API_KEY;
    delete process.env.FRICTION_SCAN_FROM_EMAIL;
    expect((await POST(request(input))).status).toBe(503);
    process.env.RESEND_API_KEY = "test-key";
    process.env.FRICTION_SCAN_FROM_EMAIL = "Andy <sender@example.com>";
    globalThis.fetch = async (url, init) => {
      expect(url).toBe("https://api.resend.com/emails");
      calls.push({ body: JSON.parse(String(init?.body)), key: new Headers(init?.headers).get("Idempotency-Key")! });
      return Response.json({ id: "test-delivery" });
    };
    expect((await POST(request({ ...input, website: "spam" }))).status).toBe(200);
    expect(calls).toHaveLength(0);
    for (let i = 0; i < 2; i++) {
      const result = await POST(request(input));
      expect(result.status).toBe(200);
      expect(await result.json()).toEqual({ sent: true });
      expect(result.headers.get("Cache-Control")).toContain("no-store");
    }
    expect(calls[0]).toEqual(calls[1]);
    expect(calls[0].body).toMatchObject({ to: "letschat@andygood.me", reply_to: input.email, from: "Andy <sender@example.com>" });
    expect(calls[0].body.text).toContain(input.message);
    await POST(request({ ...input, message: "A changed message" }));
    expect(calls[2].key).not.toBe(calls[0].key);
    for (const response of [new Response("provider error", { status: 500 }), Response.json({})]) {
      globalThis.fetch = async () => response;
      const result = await POST(request(input));
      expect(result.status).toBe(502);
      expect((await result.json()).error).toContain("could not be confirmed");
    }
    globalThis.fetch = async () => { throw new Error("timeout"); };
    expect((await POST(request(input))).status).toBe(502);
  } finally { globalThis.fetch = originalFetch; process.env = originalEnv; }
});
