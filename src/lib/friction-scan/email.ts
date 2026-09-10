import { closingNote, type Observation } from "./schema";
import type { ReportPayload } from "./token";
import { ScanError } from "./analysis";
import { fingerprint, redis } from "./controls";

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export function reportSections(data: ReportPayload) {
  const r = data.report;
  const obs = (o: Observation) => `${o.explanation}\nPage evidence: “${o.quote}”`;
  return [
    ["Executive summary", `${r.status}\n${obs(r.executiveSummary)}`],
    ...([["Clarity", r.clarity], ["Trust & proof", r.trust], ["Conversion", r.conversion], ["Search & AI visibility", r.visibility]] as const).map(([title, a]) => [title, `Strongest point: ${obs(a.strongestPoint)}\n\nMain friction: ${obs(a.mainFriction)}\n\nRecommended improvement: ${obs(a.recommendedImprovement)}`]),
    ["Priority fixes", r.priorityFixes.map((o, i) => `${i + 1}. ${obs(o)}`).join("\n\n")],
    ["What I’d fix first", obs(r.fixFirst)],
    ["Closing note", closingNote],
  ];
}
export function renderReport(data: ReportPayload) {
  const sections = reportSections(data);
  const intro = `Website Friction Scan\n${data.url}\nPage goal: ${data.input.goal}${data.input.audience ? `\nAudience: ${data.input.audience}` : ""}\n${data.warnings.join("\n")}`;
  const text = `${intro}\n\n${sections.map(([h, body]) => `${h}\n${body}`).join("\n\n")}\n\nNeed a deeper look?\nhttps://andygood.me/contact/`;
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600&display=swap" rel="stylesheet"></head><body style="margin:0;background:#ffffff;color:#121820;font-family:'Instrument Sans',Arial,sans-serif"><div style="max-width:640px;margin:auto;padding:32px 20px"><p style="font-weight:600">Andy Good</p><h1 style="font-size:32px;line-height:1.15">Website Friction Scan</h1><p style="white-space:pre-line;overflow-wrap:anywhere;color:#606a75">${escape(intro.replace("Website Friction Scan\n", ""))}</p>${sections.map(([h, body]) => `<section style="border-top:1px solid #d9dee3;margin-top:24px;padding-top:16px"><h2 style="font-size:22px">${escape(h)}</h2><p style="white-space:pre-line;line-height:1.6">${escape(body)}</p></section>`).join("")}<p><a href="https://andygood.me/contact/" style="display:inline-block;padding:12px 20px;background:#ffd400;color:#121820;font-weight:600">Need a deeper look?</a></p></div></body></html>`;
  return { text, html };
}
type Email = { to: string; subject: string; text: string; html?: string };
export interface EmailProvider { send(message: Email, idempotencyKey: string): Promise<void> }
export const resend: EmailProvider = {
  async send(message, idempotencyKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ from: process.env.FRICTION_SCAN_FROM_EMAIL, ...message }),
    });
    if (!response.ok) throw new ScanError("We could not finish sending the report and notification. Retry with the same email address; your scan is still here.");
    const data = await response.json();
    if (!data.id) throw new ScanError("Email delivery could not be confirmed. Retry with the same email address.");
  },
};
export async function deliver(data: ReportPayload, email: string, provider = resend, command = redis) {
  if (!process.env.RESEND_API_KEY || !process.env.FRICTION_SCAN_FROM_EMAIL || !process.env.FRICTION_SCAN_LEAD_EMAIL) throw new ScanError("Email delivery is not available yet. Your initial result is still available below.", 503);
  // Bind the encrypted report to a single recipient without retaining the address itself.
  const hash = fingerprint(email);
  const key = `friction:recipient:${data.id}`;
  const binding = await command(["EVAL", "local old=redis.call('GET',KEYS[1]); if old then return old end; redis.call('SET',KEYS[1],ARGV[1],'EX',3600); return ARGV[1]", 1, key, `${hash}|${new Date().toISOString()}`]);
  const [recipientHash, requestedAt] = String(binding).split("|");
  if (recipientHash !== hash) throw new ScanError("This scan is already linked to another email address. Run a new scan to change the recipient.", 409);
  const report = renderReport(data);
  // Stable content and keys allow safe retries after either provider request times out.
  await provider.send({ to: email, subject: "Your Website Friction Scan | Andy Good", ...report }, `friction-report-${data.id}`);
  await provider.send({ to: process.env.FRICTION_SCAN_LEAD_EMAIL, subject: "Website Friction Scan request", text: `Email: ${email}\nSubmitted page URL: ${data.input.url}\nPage goal: ${data.input.goal}\nAudience: ${data.input.audience || "Not supplied"}\nTimestamp: ${requestedAt}` }, `friction-lead-${data.id}`);
}
