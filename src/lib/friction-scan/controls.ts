import { createHmac } from "node:crypto";
import { ScanError } from "./analysis";

export const privateHeaders = { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
export function fingerprint(value: string) { return createHmac("sha256", process.env.FRICTION_SCAN_TOKEN_SECRET || "").update(value).digest("hex"); }
export async function redis(command: (string | number)[]) {
  const url = process.env.FRICTION_SCAN_REDIS_URL;
  const token = process.env.FRICTION_SCAN_REDIS_TOKEN;
  if (!url?.startsWith("https://") || !token) throw new ScanError("The scan is not configured yet.", 503);
  const response = await fetch(url, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(5000), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(command) });
  if (!response.ok) throw new ScanError("The scan service is temporarily unavailable. Please retry shortly.", 503);
  const data = await response.json();
  if (data.error) throw new ScanError("The scan service is temporarily unavailable. Please retry shortly.", 503);
  return data.result;
}
export async function rateLimit(request: Request, kind: "scan" | "email") {
  // Vercel overwrites x-vercel-forwarded-for. Do not trust arbitrary forwarded headers.
  const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") || "unknown" : "local";
  const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
  const count = await redis(["EVAL", script, 1, `friction:${kind}:${fingerprint(ip)}`, 3600]);
  if (Number(count) > (kind === "scan" ? 5 : 10)) throw new ScanError("You have reached the hourly limit. Please try again later.", 429);
  if (kind === "scan") {
    const total = await redis(["EVAL", script, 1, "friction:daily-scans", 86400]);
    if (Number(total) > 100) throw new ScanError("The scan has reached its daily capacity. Please try again tomorrow.", 429);
  }
}
export function ensureConfigured() {
  if (process.env.FRICTION_SCAN_ENABLED !== "true" || !(process.env.FRICTION_SCAN_API_KEY || process.env.CONTENT_BRIEFING_API_KEY) || !(process.env.FRICTION_SCAN_MODEL || process.env.CONTENT_BRIEFING_MODEL) || !/^[a-f0-9]{64}$/i.test(process.env.FRICTION_SCAN_TOKEN_SECRET || "") || !process.env.FRICTION_SCAN_REDIS_URL || !process.env.FRICTION_SCAN_REDIS_TOKEN) throw new ScanError("The scan is not available yet. Please try again later.", 503);
}
export async function readBody(request: Request, limit: number) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) throw new ScanError("Please submit the form from this website.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ScanError("Submit a valid form.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ScanError("Complete the required fields.", 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new ScanError("The submitted form is too large.", 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ScanError("Complete the form and try again.", 400); }
}
export function failure(error: unknown) {
  return Response.json({ error: error instanceof ScanError ? error.message : "The request could not be completed. Please try again shortly." }, { status: error instanceof ScanError ? error.status : 502, headers: privateHeaders });
}
