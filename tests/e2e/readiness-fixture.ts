import { buildReport, previewReport, type ReadinessPage } from "../../src/lib/ai-search-readiness/analysis";
import type { ModelAnalysis } from "../../src/lib/ai-search-readiness/schema";

export const input = { url: "https://example.com/payroll", topic: "" };
export const text = "Payroll software for growing UK teams. Trusted by thousands of businesses. Our specialists guide you through payroll onboarding. Book a demo to discuss your payroll process.";
const finding = { grade: 3, found: "The page identifies payroll software for growing UK teams. This provides a clear product and audience, though the practical process needs more explanation.", why: "Explicit product and audience descriptions help readers interpret the page's purpose.", action: "Add a short explanation of the payroll onboarding process beneath the opening proposition.", quote: "Payroll software for growing UK teams.", uncertainty: "This is an inference from extracted content, not a review of the wider business.", impact: 2, effort: "quick" as const };
export const analysis: ModelAnalysis = {
  entity: finding, structure: { ...finding, grade: 2 },
  evidence: { ...finding, grade: 1, found: "The page claims to be trusted by thousands of businesses. Supporting examples or attribution were not found in the extracted content, so the scale claim is difficult to evaluate.", quote: "Trusted by thousands of businesses.", action: "Support the scale claim with a dated customer count and an attributable payroll customer example.", impact: 3, effort: "strategic" },
  citation: { ...finding, grade: 2, effort: "strategic" }, depth: { ...finding, grade: 2, effort: "strategic" }, trust: finding,
};
export const modelResponse = { ...analysis, assessable: true, assessmentNote: "The extracted page contains a clear payroll proposition and substantive claims that can be assessed." };
export const pageFixture: ReadinessPage = { url: input.url, text, warnings: ["Only server-returned text and HTML were assessed."], technical: {
  title: "Payroll software for UK teams", canonical: input.url, headings: [{ level: 1, text: "Payroll software for UK teams" }], h1Count: 1, h1Text: "Payroll software for UK teams", robotsMeta: [], robotsHeader: "", indexRestricted: false, robots: "allowed", mainCharacters: 1000, hasMain: true, structured: [], invalidStructured: 0, authorship: [], links: [],
} };
export const report = buildReport(input, pageFixture, analysis);
export const token = "a16b8389-12d8-4f34-a6c7-a15046ad9b17";
export const scanResponse = { token, preview: previewReport(report) };
