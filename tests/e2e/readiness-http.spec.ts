import { test, expect } from "@playwright/test";
import { fork } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { modelResponse, text } from "./readiness-fixture";

test("actual production APIs return an ungated preview, unlock before email, retry private lead delivery and preserve security", async ({ request }, info) => {
  test.skip(info.project.name === "mobile", "Server integration is viewport-independent; mobile flow has separate browser tests.");
  test.setTimeout(60000);
  const socket = createServer(); socket.listen(0, "127.0.0.1"); await once(socket, "listening");
  const port = (socket.address() as { port: number }).port; await new Promise<void>((resolve) => socket.close(() => resolve()));
  const commands: unknown[][] = [], emails: { key: string; body: { to: string; subject: string; text: string; html: string } }[] = [];
  let startupError = "";
  const child = fork(join(process.cwd(), "node_modules/next/dist/bin/next"), ["start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(), execArgv: ["--import", pathToFileURL(join(process.cwd(), "tests/e2e/readiness-provider-preload.mjs")).href], stdio: ["ignore", "ignore", "pipe", "ipc"],
    env: { ...process.env, AI_SEARCH_READINESS_ENABLED: "true", FRICTION_SCAN_ENABLED: "false", FRICTION_SCAN_TOKEN_SECRET: "f".repeat(64), FRICTION_SCAN_API_KEY: "fixture", FRICTION_SCAN_MODEL: "fixture-model", FRICTION_SCAN_BASE_URL: "https://model.readiness.test/v1", FRICTION_SCAN_REDIS_URL: "https://redis.readiness.test", FRICTION_SCAN_REDIS_TOKEN: "fixture", RESEND_API_KEY: "fixture", FRICTION_SCAN_FROM_EMAIL: "scan@example.com", FRICTION_SCAN_LEAD_EMAIL: "andy@example.com", AI_SEARCH_READINESS_TEMPERATURE: "", READINESS_TEST_TEXT: text, READINESS_TEST_ANALYSIS: JSON.stringify(modelResponse) },
  });
  child.stderr?.on("data", (chunk) => { startupError = (startupError + String(chunk)).slice(-4000); });
  child.on("message", (message: { readinessTest?: boolean; kind: string; value: never }) => { if (!message.readinessTest) return; if (message.kind === "redis") commands.push(message.value); if (message.kind === "email") emails.push(message.value); });
  const base = `http://127.0.0.1:${port}`, path = `${base}/api/ai-search-readiness-scan/`;
  try {
    await expect.poll(async () => { if (child.exitCode !== null) throw new Error(`Isolated test server failed: ${startupError}`); try { return (await request.get(`${base}/ai-search-readiness-scan/`)).status(); } catch { return 0; } }, { timeout: 15000 }).toBe(200);
    const scanned = await request.post(path, { data: { url: "http://public.readiness.test/payroll" } }); expect(scanned.status()).toBe(200);
    const initial = await scanned.json(); expect(initial.preview.factors).toHaveLength(7); expect(initial).not.toHaveProperty("report"); expect(initial.preview).not.toHaveProperty("priorities");
    const fields = { token: initial.token, email: "visitor@example.com", company: "Example payroll" };
    expect((await request.post(`${path}report/`, { data: { ...fields, action: "status" } })).status()).toBe(403);
    const unlocked = await request.post(`${path}report/`, { data: fields }); expect(unlocked.status()).toBe(200);
    const full = await unlocked.json(); expect(full.report.factors).toHaveLength(7); expect(full.report.priorities).toHaveLength(3); expect(full.status).toBe("pending");
    expect(full.report.score).toBe(initial.preview.score); expect(full.report.url).toBe(initial.preview.url);
    await expect.poll(async () => (await (await request.post(`${path}report/`, { data: { ...fields, action: "status" } })).json()).status).toBe("failed");
    expect((await request.post(`${path}report/`, { data: { ...fields, email: "other@example.com" } })).status()).toBe(409);
    expect((await request.post(`${path}report/`, { data: { ...fields, action: "retry" } })).status()).toBe(200);
    await expect.poll(async () => (await (await request.post(`${path}report/`, { data: { ...fields, action: "status" } })).json()).status).toBe("sent");
    await expect.poll(() => emails.length).toBe(4); expect(emails[0]).toEqual(emails[2]); expect(emails[1]).toEqual(emails[3]);
    expect(emails[1].body.to).toBe("andy@example.com"); expect(emails[0].body.html).toContain("AI Search Readiness");
    expect(JSON.stringify(commands)).not.toContain(fields.email);
    expect(commands.some((c) => c[0] === "SET" && c.includes("EX") && c.includes(1800))).toBe(true);
    expect(commands.some((c) => c[0] === "EXPIREAT")).toBe(true);
    for (const url of ["http://localhost/private", "http://public.readiness.test/redirect"]) {
      const denied = await request.post(path, { data: { url } }); expect(denied.status()).toBe(422); expect(await denied.json()).not.toHaveProperty("preview");
    }
    for (let i = 0; i < 3; i++) await request.post(path, { data: { url: "http://localhost/private" } });
    expect((await request.post(path, { data: { url: "http://public.readiness.test/payroll" } })).status()).toBe(429);
    await expect.poll(() => emails.length).toBe(4);
  } finally {
    if (child.exitCode === null) { const stopped = once(child, "exit"); child.kill(); await stopped; }
  }
});
