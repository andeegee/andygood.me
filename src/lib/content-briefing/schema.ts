import { z } from "zod";

const required = z.string().trim().min(1).max(2000);
export const assignmentSchema = z.object({
  topic: required, contentType: required, audience: required, objective: required,
  funnelStage: required, cta: required, query: z.string().trim().max(1000),
  sourceText: z.string().trim().max(40000),
  urls: z.array(z.string().trim().url().max(2048)).max(5),
  notes: z.string().trim().max(5000),
}).strict().refine((v) => v.sourceText.length > 0 || v.urls.length > 0, { message: "Supply pasted source text or at least one public URL." });
export type Assignment = z.infer<typeof assignmentSchema>;
const text = z.string().min(1).max(4000);
const list = z.array(text).max(20);
export const findingSchema = z.object({
  id: text, finding: text,
  classification: z.enum(["Source-supported", "Inference", "Needs evidence"]),
  references: z.array(z.object({ sourceId: text, quote: text }).strict()).max(10),
}).strict();
export const analysisSchema = z.object({
  findings: z.array(findingSchema).max(50),
  gaps: z.array(z.object({ kind: z.enum(["Missing evidence", "Unanswered question", "Ambiguity", "Contradiction", "Human decision"]), detail: text, nextStep: text }).strict()).max(30),
}).strict();
export const briefSchema = z.object({
  direction: z.object({ primaryAngle: text, secondaryAngles: list, keyMessage: text, readerNeed: text, desiredShift: text }).strict(),
  requirements: z.object({ questions: list, objections: list, keyPoints: list, evidenceIds: list, terminology: list, outline: list, cta: text }).strict(),
  search: z.object({ intent: text, questions: list, entities: list, answerConsiderations: list }).strict().nullable(),
}).strict();
export type Analysis = z.infer<typeof analysisSchema>;
export type Brief = z.infer<typeof briefSchema>;
export type Source = { id: string; label: string; url?: string; text: string; warning?: string };
export type Result = { assignment: Assignment; brief: Brief; analysis: Analysis; sources: Omit<Source, "text">[] };

export const assignmentLabels = { topic: "Working topic/title", contentType: "Content type", audience: "Audience", objective: "Commercial objective", funnelStage: "Funnel stage", cta: "Desired reader action / CTA", query: "Target search query or search intent", notes: "Additional notes / constraints" };
export const directionLabels = { primaryAngle: "Primary content angle", secondaryAngles: "Secondary angles", keyMessage: "Key message", readerNeed: "Reader problem / need", desiredShift: "Desired shift" };
export const requirementLabels = { questions: "Questions to answer", objections: "Objections to address", keyPoints: "Key points", evidenceIds: "Proof / evidence to use", terminology: "Terminology and language constraints", outline: "Proposed structure / outline", cta: "CTA" };
export const searchLabels = { intent: "Likely search intent", questions: "Important questions", entities: "Useful entities / topics", answerConsiderations: "GEO / AEO considerations" };

export function toMarkdown(result: Result) {
  const escape = (value: string) => value.replace(/[\\`*_{}\[\]<>#|]/g, "\\$&");
  const section = (title: string, values: Record<string, string | string[]>, labels: Record<string, string>) => `## ${title}\n\n` + Object.entries(values).map(([key, value]) => `### ${labels[key] ?? key}\n\n${Array.isArray(value) ? value.map((v) => `- ${escape(v)}`).join("\n") || "None identified." : escape(value)}\n`).join("\n");
  const { sourceText: _sourceText, urls: _urls, ...assignment } = result.assignment;
  void _sourceText; void _urls;
  return `# Content brief\n\nAI draft · Human review required\n\nStrategic recommendations require review. Source-supported means supported by supplied text, not independently verified.\n\n` +
    section("Assignment", assignment, assignmentLabels) + section("Strategic direction", result.brief.direction, directionLabels) + section("Content requirements", result.brief.requirements, requirementLabels) +
    (result.brief.search ? section("Search / discoverability", result.brief.search, searchLabels) : "") +
    `\n## Evidence and findings\n\n` + result.analysis.findings.map((f) => `### ${escape(f.id)} · ${f.classification}\n\n${escape(f.finding)}\n\n${f.references.map((r) => `${escape(r.sourceId)}: “${escape(r.quote)}”`).join("\n\n")}`).join("\n\n") +
    `\n\n## Gaps & decisions\n\n` + result.analysis.gaps.map((g) => `- **${g.kind}:** ${escape(g.detail)} Next step: ${escape(g.nextStep)}`).join("\n") +
    `\n\n## Sources\n\n` + result.sources.map((s) => `- ${escape(s.id)}: ${escape(s.label)}${s.url ? ` (${escape(s.url)})` : ""}${s.warning ? ` · ${escape(s.warning)}` : ""}`).join("\n") + "\n";
}
