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
  const r = data.report;
  const metadata = [["Page", data.url], ["Page goal", data.input.goal], ["Audience", data.input.audience || "Not supplied"]];
  const areas = [["Clarity", r.clarity], ["Trust & proof", r.trust], ["Conversion", r.conversion], ["Search & AI visibility", r.visibility]] as const;
  const fixes = r.priorityFixes.slice(0, 3).map((o, i) => {
    const [heading, ...body] = o.explanation.split(/\r?\n/).filter((line) => line.trim());
    return { number: String(i + 1).padStart(2, "0"), heading: body.length ? heading : `Priority ${i + 1}`, body: body.length ? body.join(" ") : o.explanation };
  });
  const closing = [closingNote, ...data.warnings].join("\n\n");
  const cta = "If this is a page that matters commercially, I can look at the context behind it and help you work out what to change first.";
  const text = `Andy Good\nSenior Content & AI Strategist\nWebsite Friction Scan\n\n${metadata.map(([label, value]) => `${label}\n${value}`).join("\n\n")}\n\nScan status\n${r.status}\n\nExecutive summary\n${r.executiveSummary.explanation}\n\nWhat I’d fix first\n${r.fixFirst.explanation}\n\n${areas.map(([title, a]) => `${title}\nWhat’s working\n${a.strongestPoint.explanation}\n\nMain friction\n${a.mainFriction.explanation}\n\nPage evidence\n“${a.mainFriction.quote}”\n\nRecommendation\n${a.recommendedImprovement.explanation}`).join("\n\n")}\n\nPriority fixes\n${fixes.map((f) => `${f.number} / ${f.heading}\n${f.body}`).join("\n\n")}\n\nClosing note\n${closing}\n\nWant a second pair of eyes on it?\n${cta}\n\nStart a conversation\nhttps://andygood.me/contact/`;
  const html = emailLayout("Website Friction Scan", `
    ${row(`<p style="margin:0 0 8px;font-size:28px;font-weight:600">Andy Good</p><p style="margin:0 0 28px;font-size:14px">Senior Content &amp; AI Strategist</p><h1 style="margin:0;font-size:36px;line-height:1.15;font-weight:600">Website Friction Scan</h1>`, "padding:36px 24px 28px")}
    ${row(metadata.map(([label, value]) => field(label, value)).join(""))}
    ${row(`<p style="margin:0 0 6px;font-size:14px">Scan status</p><p style="margin:0;font-size:26px;line-height:1.25;font-weight:600">${escape(r.status)}</p>`, "padding:20px 24px;border-top:1px solid #D9DEE3;border-bottom:1px solid #D9DEE3")}
    ${row(`${heading("Executive summary")}${paragraph(r.executiveSummary.explanation)}`)}
    ${row(`${heading("What I’d fix first")}${paragraph(r.fixFirst.explanation)}`, "padding:24px;background:#F3F5F7;border-left:4px solid #FFD400")}
    ${areas.map(([title, a]) => row(`${heading(title)}${field("What’s working", a.strongestPoint.explanation)}${field("Main friction", a.mainFriction.explanation)}<p style="margin:0 0 8px;font-size:14px;font-weight:600">Page evidence</p><blockquote style="margin:0 0 20px;padding:12px 16px;border-left:2px solid #D9DEE3;background:#F3F5F7;font-size:15px">“${escape(a.mainFriction.quote)}”</blockquote>${field("Recommendation", a.recommendedImprovement.explanation)}`, "padding:28px 24px;border-bottom:1px solid #D9DEE3")).join("")}
    ${row(`${heading("Priority fixes")}${fixes.map((f) => `<h3 style="margin:20px 0 8px;font-size:18px;line-height:1.35;font-weight:600">${f.number} / ${escape(f.heading)}</h3>${paragraph(f.body)}`).join("")}`)}
    ${row(`<p style="margin:0 0 8px;font-size:13px;font-weight:600">Closing note</p>${closing.split("\n\n").map((note) => `<p style="margin:0 0 12px;font-size:13px;line-height:1.5">${escape(note)}</p>`).join("")}`, "padding:20px 24px;border-top:1px solid #D9DEE3")}
    ${row(`${heading("Want a second pair of eyes on it?")}${paragraph(cta)}${button("Start a conversation", "https://andygood.me/contact/")}`, "padding:24px 24px 36px")}
  `);
  return { text, html };
}

const heading = (title: string) => `<h2 style="margin:0 0 16px;font-size:23px;line-height:1.25;font-weight:600">${escape(title)}</h2>`;
const paragraph = (text: string) => `<p style="margin:0 0 16px">${escape(text)}</p>`;
const field = (label: string, value: string) => `<p style="margin:0 0 4px;font-size:14px;font-weight:600">${escape(label)}</p>${paragraph(value)}`;
const row = (html: string, style = "padding:24px") => `<tr><td style="${style}">${html}</td></tr>`;
const button = (label: string, url: string) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#FFD400" style="padding:14px 18px"><a href="${escape(url)}" style="color:#121820;font-weight:600;text-decoration:underline;display:inline-block">${escape(label)}</a></td></tr></table>`;
function emailLayout(title: string, rows: string) {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title><!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600&display=swap" rel="stylesheet"><!--<![endif]--></head><body style="margin:0;padding:0;background:#FFFFFF;color:#121820"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="border-collapse:collapse"><tr><td align="center"><!--[if mso]><table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;table-layout:fixed;border-collapse:collapse;color:#121820;font-family:'Instrument Sans',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;overflow-wrap:anywhere;word-wrap:break-word">${rows}</table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}

export function renderLead(data: ReportPayload, email: string, requestedAt: string) {
  const fields = [["Prospect", email], ["Page", data.input.url], ["Goal", data.input.goal], ["Audience", data.input.audience || "Not supplied"], ["Status", data.report.status], ["What I’d fix first", data.report.fixFirst.explanation]];
  return {
    text: `New Website Friction Scan\n\n${fields.map(([label, value]) => `${label}\n${value}`).join("\n\n")}\n\nOpen submitted page\n${data.input.url}\n\nTimestamp: ${requestedAt}`,
    html: emailLayout("New Website Friction Scan", `${row(`<p style="margin:0 0 16px;font-weight:600">Andy Good</p><h1 style="margin:0;font-size:26px;line-height:1.25">New Website Friction Scan</h1>`)}${row(fields.map(([label, value]) => field(label, value)).join(""), "padding:0 24px 8px")}${row(`${button("Open submitted page", data.input.url)}<p style="margin:20px 0 0;font-size:13px">Timestamp: ${escape(requestedAt)}</p>`)}`),
  };
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
  await provider.send({ to: process.env.FRICTION_SCAN_LEAD_EMAIL, subject: "Website Friction Scan request", ...renderLead(data, email, requestedAt) }, `friction-lead-${data.id}`);
}
