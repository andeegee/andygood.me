import type { Result } from "../../src/lib/content-briefing/schema";
export const fixture: Result = {
  assignment: { topic: "A clearer onboarding process", contentType: "Article", audience: "SaaS marketing leaders", objective: "Support qualified enquiries", funnelStage: "Consideration", cta: "Book a discovery call", query: "", sourceText: "The pilot involved 12 teams over six weeks. No conversion results were measured.", urls: [], notes: "Avoid unsupported performance claims." },
  sources: [{ id: "S1", label: "User-supplied source material" }],
  analysis: { findings: [
    { id: "F1", finding: "The pilot involved 12 teams over six weeks.", classification: "Source-supported", references: [{ sourceId: "S1", quote: "The pilot involved 12 teams over six weeks." }] },
    { id: "F2", finding: "A process-led angle may help the audience compare approaches.", classification: "Inference", references: [] },
    { id: "F3", finding: "Improved conversion requires measurement.", classification: "Needs evidence", references: [] },
  ], gaps: [{ kind: "Missing evidence", detail: "Conversion impact was not measured.", nextStep: "Request baseline and follow-up conversion data." }, { kind: "Human decision", detail: "Choose the client example to feature.", nextStep: "Confirm permission and relevance." }] },
  brief: { direction: { primaryAngle: "Explain the onboarding process using the pilot.", secondaryAngles: [], keyMessage: "Evaluate the process against audience needs.", readerNeed: "Understand how the approach could fit their team.", desiredShift: "Move from interest to informed evaluation." }, requirements: { questions: ["What did the pilot cover?"], objections: ["Would this work for our team?"], keyPoints: ["F1: 12 teams participated over six weeks."], evidenceIds: ["F1"], terminology: ["Avoid unmeasured performance claims."], outline: ["Reader challenge", "Pilot scope (F1)", "Limitations and next steps"], cta: "Book a discovery call" }, search: null },
};
