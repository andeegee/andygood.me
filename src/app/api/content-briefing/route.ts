import { assignmentSchema } from "@/lib/content-briefing/schema";
import { generateBrief } from "@/lib/content-briefing/workflow";

export const runtime = "nodejs";
export const maxDuration = 180;
const headers = { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" };
let active = 0;

export async function POST(request: Request) {
  const reply = (body: unknown, status: number) => Response.json(body, { status, headers });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Cross-origin submissions are not allowed." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return reply({ error: "Submit JSON." }, 415);
  let raw: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "An assignment is required." }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 240000) { await reader.cancel(); return reply({ error: "Input is too long. Reduce the source material." }, 413); } chunks.push(value); }
    raw = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return reply({ error: "The assignment could not be read. Submit valid JSON." }, 400); }
  const parsed = assignmentSchema.safeParse(raw);
  if (!parsed.success) return reply({ error: "Complete all required assignment fields and supply text or up to five public URLs. Check the input length limits." }, 400);
  if (process.env.CONTENT_BRIEFING_ENABLED !== "true") return reply({ error: "Content briefing is not enabled. Set the server configuration before testing live." }, 503);
  if (!process.env.CONTENT_BRIEFING_API_KEY || !process.env.CONTENT_BRIEFING_MODEL) return reply({ error: "The model provider is not configured. Set the API key and model on the server." }, 503);
  if (active >= 2) return reply({ error: "The briefing service is busy. Please retry shortly." }, 429);
  active++;
  try { return reply(await generateBrief(parsed.data), 200); }
  catch (error) {
    const message = error instanceof Error ? error.message : "";
    const safe = /^(No usable|The model|The brief|Model endpoint)/.test(message) ? message : "The briefing could not be completed. A source or model request may have timed out. Please retry.";
    return reply({ error: safe }, 502);
  } finally { active--; }
}
