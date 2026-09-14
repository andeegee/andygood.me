import { z } from "zod";
import { ScanError } from "@/lib/friction-scan/analysis";
import { fingerprint, redis } from "@/lib/friction-scan/controls";
import { emailLayout, resend, type EmailProvider } from "@/lib/friction-scan/email";
import {
  calculateResult,
  contextOptions,
  dimensionInterpretations,
  dimensionLabels,
  dimensions,
  questions,
  scoreBand,
  type Answers,
  type DiagnosticResult,
} from "./config";

const score = z.number().int().min(0).max(3);
const answersSchema = z.record(z.string(), score).superRefine((answers, context) => {
  const ids = new Set(questions.map(({ id }) => id));
  if (Object.keys(answers).length !== ids.size || Object.keys(answers).some((id) => !ids.has(id as never)) || questions.some(({ id }) => answers[id] === undefined)) {
    context.addIssue({ code: "custom", message: "Answer every diagnostic question." });
  }
});

export const submissionSchema = z.object({
  submissionId: z.uuid(),
  email: z.string().trim().toLowerCase().max(254).email(),
  company: z.string().trim().max(300).default(""),
  role: z.enum(contextOptions.role),
  teamSize: z.enum(contextOptions.teamSize),
  monthlyOutput: z.enum(contextOptions.monthlyOutput),
  answers: answersSchema,
});

export type DiagnosticSubmission = z.infer<typeof submissionSchema>;
export type CommercialFit = "High potential" | "Possible fit" | "Low urgency";

export function commercialFit(data: Pick<DiagnosticSubmission, "role" | "teamSize" | "monthlyOutput">, overallScore: number): CommercialFit {
  const senior = ["Founder / CEO", "CMO / marketing leader", "Head of Content / Content Lead"].includes(data.role) ? 2 : 0;
  const team = data.teamSize === "2–5" ? 1 : ["6–15", "16+"].includes(data.teamSize) ? 2 : 0;
  const output = data.monthlyOutput === "6–15" ? 1 : ["16–30", "30+"].includes(data.monthlyOutput) ? 2 : 0;
  const total = senior + team + output + (overallScore <= 59 ? 1 : 0);
  return total >= 5 ? "High potential" : total >= 3 ? "Possible fit" : "Low urgency";
}

const escape = (value: string | number) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));
const row = (content: string, style = "padding:24px;border-bottom:1px solid #D9DEE3") => `<tr><td style="${style}">${content}</td></tr>`;
const heading = (value: string) => `<h2 style="margin:0 0 14px;font-size:23px;line-height:1.25;font-weight:600">${escape(value)}</h2>`;
const paragraph = (value: string) => `<p style="margin:0 0 14px">${escape(value)}</p>`;
const field = (label: string, value: string | number) => `<p style="margin:0 0 4px;font-size:14px;font-weight:600">${escape(label)}</p>${paragraph(String(value))}`;
const button = (label: string, href: string) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#FFD400" style="padding:14px 18px"><a href="${escape(href)}" style="color:#121820;font-weight:600;text-decoration:underline;display:inline-block">${escape(label)}</a></td></tr></table>`;

export function renderDiagnosticReport(result: DiagnosticResult) {
  const dimensionText = dimensions.map((dimension) => `${dimensionLabels[dimension]}: ${result.dimensionScores[dimension]}/100\n${dimensionInterpretations[dimension]} This places the area in the ${scoreBand(result.dimensionScores[dimension]).label.toLowerCase()} range.`).join("\n\n");
  const risks = result.riskFlags.length ? result.riskFlags.map((flag) => `${flag.title}\n${flag.copy}`).join("\n\n") : "No priority risk flags were triggered.";
  const opportunities = result.aiOpportunities.length ? result.aiOpportunities.map((item) => `${item.title}\n${item.copy}`).join("\n\n") : "No immediate AI opportunity was prioritised ahead of the wider workflow improvements.";
  const close = "If content is taking too long, AI isn't improving quality, or your team keeps solving the same problems repeatedly, I can help work out what actually needs redesigning.";
  const text = `Andy Good\nSenior Content & AI Strategist\nContent Workflow Diagnostic\n\nOverall result\n${result.overallScore}/100 · ${result.maturityBand}\n\n${dimensionText}\n\nPrimary bottleneck\n${dimensionLabels[result.primaryBottleneck]}\n${result.primaryDiagnosis}\n\nRisk flags\n${risks}\n\nThree priority improvements\n${result.priorities.map((item, index) => `${index + 1}. ${item.label}\n${item.recommendation}`).join("\n\n")}\n\nRelevant AI opportunities\n${opportunities}\n\nWant me to look at the system behind the score?\n${close}\n\nTalk through my content system\nhttps://andygood.me/contact/`;
  const dimensionRows = dimensions.map((dimension) => `<div style="margin:0 0 20px">${field(dimensionLabels[dimension], `${result.dimensionScores[dimension]}/100`)}${paragraph(`${dimensionInterpretations[dimension]} This places the area in the ${scoreBand(result.dimensionScores[dimension]).label.toLowerCase()} range.`)}</div>`).join("");
  const html = emailLayout("Content Workflow Diagnostic", `
    ${row(`<p style="margin:0 0 8px;font-size:28px;font-weight:600">Andy Good</p><p style="margin:0 0 28px;font-size:14px">Senior Content &amp; AI Strategist</p><h1 style="margin:0;font-size:36px;line-height:1.15;font-weight:600">Content Workflow Diagnostic</h1>`, "padding:36px 24px 28px")}
    ${row(`${field("Overall result", `${result.overallScore}/100`)}${field("Maturity band", result.maturityBand)}`, "padding:24px;background:#121820;color:#FFFFFF")}
    ${row(`${heading("Your five-part assessment")}${dimensionRows}`)}
    ${row(`${heading("Primary bottleneck")}${field(dimensionLabels[result.primaryBottleneck], result.primaryDiagnosis)}${field("First move", result.immediateRecommendation)}`, "padding:24px;background:#F3F5F7;border-left:4px solid #FFD400")}
    ${row(`${heading("Risk flags")}${result.riskFlags.length ? result.riskFlags.map((flag) => field(flag.title, flag.copy)).join("") : paragraph("No priority risk flags were triggered.")}`)}
    ${row(`${heading("Three priority improvements")}${result.priorities.map((item, index) => field(`${index + 1}. ${item.label}`, item.recommendation)).join("")}`)}
    ${row(`${heading("Relevant AI opportunities")}${result.aiOpportunities.length ? result.aiOpportunities.map((item) => field(item.title, item.copy)).join("") : paragraph("No immediate AI opportunity was prioritised ahead of the wider workflow improvements.")}`)}
    ${row(`${heading("Want me to look at the system behind the score?")}${paragraph(close)}${button("Talk through my content system", "https://andygood.me/contact/")}`, "padding:24px 24px 36px")}
  `);
  return { text, html };
}

export function renderDiagnosticLead(data: DiagnosticSubmission, result: DiagnosticResult, fit: CommercialFit, created: string) {
  const risks = result.riskFlags.map(({ title }) => title).join(", ") || "None";
  const scores = dimensions.map((dimension) => [dimensionLabels[dimension], `${result.dimensionScores[dimension]}/100`] as const);
  const fields = [
    ["Email", data.email], ["Company / website", data.company || "Not supplied"], ["Role", data.role], ["Team size", data.teamSize],
    ["Monthly content output", data.monthlyOutput], ["Overall score", `${result.overallScore}/100`], ["Maturity band", result.maturityBand],
    ...scores, ["Primary bottleneck", dimensionLabels[result.primaryBottleneck]], ["Triggered risk flags", risks], ["Commercial fit", fit],
  ];
  return {
    text: `New Content Workflow Diagnostic lead\n\n${fields.map(([label, value]) => `${label}\n${value}`).join("\n\n")}\n\nTimestamp: ${created}`,
    html: emailLayout("New Content Workflow Diagnostic lead", `${row(`<p style="margin:0 0 16px;font-weight:600">Andy Good</p><h1 style="margin:0;font-size:26px;line-height:1.25">New Content Workflow Diagnostic lead</h1>`)}${row(fields.map(([label, value]) => field(label, value)).join(""), "padding:0 24px 8px")}${row(`<p style="margin:0;font-size:13px">Timestamp: ${escape(created)}</p>`)}`),
  };
}

export async function deliverDiagnostic(data: DiagnosticSubmission, provider: EmailProvider = resend, command = redis) {
  if (!process.env.RESEND_API_KEY || !process.env.FRICTION_SCAN_FROM_EMAIL || !process.env.FRICTION_SCAN_LEAD_EMAIL || !process.env.FRICTION_SCAN_REDIS_URL || !process.env.FRICTION_SCAN_REDIS_TOKEN || !/^[a-f0-9]{64}$/i.test(process.env.FRICTION_SCAN_TOKEN_SECRET || "")) throw new ScanError("Email delivery is not available yet.", 503);
  const result = calculateResult(data.answers as Answers);
  const fit = commercialFit(data, result.overallScore);
  const hash = fingerprint(data.email);
  const bindingKey = `diagnostic:recipient:${data.submissionId}`;
  const binding = await command(["EVAL", "local old=redis.call('GET',KEYS[1]); if old then return old end; redis.call('SET',KEYS[1],ARGV[1],'EX',2592000); return ARGV[1]", 1, bindingKey, `${hash}|${new Date().toISOString()}`]);
  const [recipientHash, created] = String(binding).split("|");
  if (recipientHash !== hash) throw new ScanError("This diagnostic is already linked to another email address. Start a new diagnostic to change the recipient.", 409);
  try {
    await provider.send({ to: data.email, subject: "Your Content Workflow Diagnostic | Andy Good", ...renderDiagnosticReport(result) }, `diagnostic-report-${data.submissionId}`);
    await provider.send({ to: process.env.FRICTION_SCAN_LEAD_EMAIL, reply_to: data.email, subject: "Content Workflow Diagnostic lead", ...renderDiagnosticLead(data, result, fit, created) }, `diagnostic-lead-${data.submissionId}`);
  } catch { throw new ScanError("We could not finish sending the report and notification. Retry with the same email address; your diagnostic is still here."); }
  await command(["SET", `diagnostic:submission:${data.submissionId}`, JSON.stringify({ created, emailHash: hash, company: data.company, role: data.role, teamSize: data.teamSize, monthlyOutput: data.monthlyOutput, answers: data.answers, result, commercialFit: fit }), "EX", 2592000]);
  return result;
}
