import type { Report, ScanResponse } from "../../src/lib/friction-scan/schema";
export const sourceText = "Payroll software for growing UK teams. Book a demo with our payroll specialists. See how our guided onboarding works. Trusted by thousands of businesses.";
const quote = "Payroll software for growing UK teams.";
const strength = { explanation: "The opening names the product and intended audience directly.", quote };
const friction = { explanation: "The extracted text names growing teams but does not explain the practical benefit of switching.", quote };
const improvement = { explanation: "Connect the product to a concrete payroll task and explain what a demo will help the reader decide.", quote: "Book a demo with our payroll specialists." };
const area = { strongestPoint: strength, mainFriction: friction, recommendedImprovement: improvement };
export const report: Report = {
  status: "Needs attention", strengths: [strength],
  frictionPoints: [
    { heading: "Make the benefit tangible", ...friction, whyItMatters: "Readers may need a clearer reason to consider changing their payroll process." },
    { heading: "Support the trust claim", explanation: "The page says it is trusted by thousands, but no attributable example appears in the extracted text.", quote: "Trusted by thousands of businesses.", whyItMatters: "A specific example could help readers assess the claim." },
    { heading: "Explain the demo", ...improvement, whyItMatters: "Knowing what happens next may reduce uncertainty about taking the next step." },
  ], fixFirst: improvement, executiveSummary: friction,
  clarity: area, trust: area, conversion: area, visibility: area, priorityFixes: [improvement],
};
export const scanInput = { url: "https://example.com/payroll", goal: "Book a demo", audience: "UK founders" };
export const scanResponse: ScanResponse = { preview: { status: report.status, strengths: report.strengths, frictionPoints: report.frictionPoints, fixFirst: report.fixFirst }, token: "test-token-not-for-production", url: scanInput.url, warnings: ["Based on readable page text only. Visual design, interactions, analytics and search performance were not tested."] };
