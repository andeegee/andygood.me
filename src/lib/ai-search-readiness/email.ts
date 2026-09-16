import { emailLayout } from "../friction-scan/email";
import { limitation, strategyCopy } from "./config";
import type { Report } from "./schema";

const escape = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const row = (title: string, copy: string, accent = false) => `<tr><td style="padding:24px;border-bottom:1px solid #D9DEE3;${accent ? "border-left:4px solid #FFD400;background:#F3F5F7;" : ""}"><h2 style="margin:0 0 12px;font-size:23px;line-height:1.25;font-weight:600">${escape(title)}</h2>${copy.split("\n\n").map((p) => `<p style="margin:0 0 12px;white-space:pre-line">${escape(p)}</p>`).join("")}</td></tr>`;

export function renderReport(report: Report) {
  const weakest = report.factors.find((f) => f.id === report.weakest)!;
  const sections = [
    ["Scanned page", `${report.url}\nTarget topic/question: ${report.topic || "Not supplied"}`],
    ["AI Search Readiness", `${report.score}/100\n${report.band}\n${report.bandCopy}`],
    ...report.factors.map((f) => [`${f.label}: ${f.score}/${f.maximum}`, `${f.found}\n\nRecommended action: ${f.action}`]),
    ["Biggest opportunity", `${weakest.label}\n${weakest.found}\n\nFirst move: ${weakest.action}`],
    ["Top three priorities", report.priorities.map((id, index) => { const f = report.factors.find((f) => f.id === id)!; return `${index + 1}. ${f.label}\n${f.action}`; }).join("\n\n")],
    ["Important limitation", [limitation, ...report.warnings].join("\n\n")],
    ["Want me to look at the content behind the score?", `${strategyCopy}\n\nTalk through my AI search strategy\nhttps://andygood.me/contact/`],
  ];
  return {
    text: `Andy Good\nSenior Content & AI Strategist\nAI Search Readiness Scan\n\n${sections.map(([title, copy]) => `${title}\n${copy}`).join("\n\n")}`,
    html: emailLayout("AI Search Readiness Scan", `<tr><td style="padding:36px 24px"><p style="margin:0 0 8px;font-size:28px;font-weight:600">Andy Good</p><p style="margin:0 0 24px;font-size:14px">Senior Content &amp; AI Strategist</p><h1 style="margin:0;font-size:36px;line-height:1.15;font-weight:600">AI Search Readiness Scan</h1></td></tr>${sections.map(([title, copy]) => row(title, copy, title === "Biggest opportunity")).join("")}<tr><td style="padding:24px"><a href="https://andygood.me/contact/" style="display:inline-block;padding:14px 18px;background:#FFD400;color:#121820;font-weight:600">Talk through my AI search strategy</a></td></tr>`),
  };
}
export function renderLead(report: Report, email: string, company: string) {
  const fields = [
    ["Email", email], ["Company / website", company || "Not supplied"], ["Scanned URL", report.url], ["Target topic/question", report.topic || "Not supplied"],
    ["RESULT", `Overall: ${report.score}/100\nBand: ${report.band}`],
    ...report.factors.map((f) => [f.label, `${f.score}/${f.maximum}`]),
    ["Primary weakness", report.factors.find((f) => f.id === report.weakest)!.label],
    ["Top three priorities", report.priorities.map((id, i) => { const f = report.factors.find((f) => f.id === id)!; return `${i + 1}. ${f.label}\n${f.action}`; }).join("\n\n")],
  ];
  return { text: `AI SEARCH READINESS LEAD\n\n${fields.map(([title, copy]) => `${title}:\n${copy}`).join("\n\n")}`,
    html: emailLayout("AI SEARCH READINESS LEAD", `<tr><td style="padding:24px"><h1 style="font-size:26px;line-height:1.25">AI SEARCH READINESS LEAD</h1></td></tr>${fields.map(([title, copy]) => row(title, copy)).join("")}`) };
}
