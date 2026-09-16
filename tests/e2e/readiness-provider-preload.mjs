// Test-process-only mocks. Never loaded by the application or deployment.
import dns from "node:dns/promises";
import http from "node:http";
import { Readable } from "node:stream";
import { EventEmitter } from "node:events";
const originalLookup = dns.lookup, originalGet = http.get;
const values = new Map(), accepted = new Map();
let leadFailed = false;
const send = (kind, value) => process.send?.({ readinessTest: true, kind, value });
dns.lookup = async (host, options) => host.endsWith("readiness.test") ? [{ address: host.startsWith("internal") ? "10.0.0.1" : "93.184.216.34", family: 4 }] : originalLookup(host, options);
http.get = (url, options, callback) => {
  if (url.hostname !== "public.readiness.test") return originalGet(url, options, callback);
  const body = url.pathname === "/robots.txt" ? "User-agent: *\nAllow: /" : `<html><head><title>Payroll for UK teams</title><link rel="canonical" href="http://public.readiness.test/payroll"></head><body><main><h1>Payroll for UK teams</h1><p>${process.env.READINESS_TEST_TEXT}</p></main></body></html>`;
  const res = Readable.from([Buffer.from(body)]);
  res.statusCode = url.pathname === "/redirect" ? 302 : 200;
  res.headers = { "content-type": url.pathname === "/robots.txt" ? "text/plain" : "text/html", ...(res.statusCode === 302 ? { location: "http://internal.readiness.test/page" } : {}) };
  queueMicrotask(() => callback(res));
  return new EventEmitter();
};
globalThis.fetch = async (url, init) => {
  const address = String(url), body = JSON.parse(String(init?.body));
  if (address === "https://redis.readiness.test") {
    send("redis", body);
    const [op, key, value] = body;
    let result = null;
    if (op === "GET") result = values.get(key) || null;
    else if (op === "SET") { if (!body.includes("NX") || !values.has(key)) { values.set(key, String(value)); result = "OK"; } }
    else if (op === "EXPIREAT") result = Number(values.has(key));
    else if (op === "EVAL" && body[2] === 2) {
      if (values.has(body[4])) { if (!values.has(body[3])) values.set(body[3], String(body[5])); result = values.get(body[3]); }
    } else if (op === "EVAL" && key.includes("INCR")) {
      result = Number(values.get(body[3]) || 0) + 1; values.set(body[3], String(result));
    } else if (op === "EVAL" && body[2] === 1) {
      if (values.get(body[3]) === body[4]) values.delete(body[3]); result = 1;
    } else throw new Error("Unexpected Redis test command");
    return Response.json({ result });
  }
  if (address === "https://model.readiness.test/v1/chat/completions") {
    send("model", body);
    return Response.json({ choices: [{ finish_reason: "stop", message: { content: process.env.READINESS_TEST_ANALYSIS } }] });
  }
  if (address === "https://api.resend.com/emails") {
    const key = new Headers(init.headers).get("Idempotency-Key");
    send("email", { key, body });
    if (key.startsWith("readiness-lead") && !leadFailed) { leadFailed = true; return new Response("Test partial failure", { status: 503 }); }
    if (!accepted.has(key)) accepted.set(key, `accepted-${accepted.size + 1}`);
    return Response.json({ id: accepted.get(key) });
  }
  throw new Error("Unexpected network call in isolated readiness test");
};
