import type { Result } from "@/lib/content-briefing/schema";

// A presentation-only selection. Preserve the generated order within each group;
// prefer proof already recommended by the full brief, without inventing scores.
export function selectSummary(result: Result) {
  const { assignment, brief, analysis } = result;
  const groups = [
    brief.requirements.questions.map((text) => ({ label: "Question", text })),
    brief.requirements.keyPoints.map((text) => ({ label: "Key point", text })),
    brief.requirements.objections.map((text) => ({ label: "Objection", text })),
  ];
  // Include all groups even if there are no questions or other groups are longer.
  const balanced = Array.from({ length: Math.max(...groups.map((g) => g.length)) }, (_, i) => groups.flatMap((g) => g[i] ? [g[i]] : [])).flat();
  const supported = analysis.findings.filter((f) => f.classification === "Source-supported");
  const evidence = [...brief.requirements.evidenceIds.flatMap((id) => supported.filter((f) => f.id === id)), ...supported]
    .filter((f, i, all) => all.findIndex((other) => other.id === f.id) === i).slice(0, 5);
  const gaps = [
    ...analysis.gaps.filter((g) => g.kind === "Contradiction"),
    ...analysis.gaps.filter((g) => g.kind === "Human decision"),
    ...analysis.gaps.filter((g) => g.kind === "Missing evidence"),
    ...analysis.findings.filter((f) => f.classification === "Needs evidence").map((f) => ({ kind: "Needs evidence", detail: `${f.id}: ${f.finding}`, nextStep: "Find supporting evidence before use." })),
    ...analysis.gaps.filter((g) => ["Ambiguity", "Unanswered question"].includes(g.kind)),
  ];
  // Surface different kinds of blockers before filling remaining places.
  const category = (kind: string) => ["Missing evidence", "Needs evidence"].includes(kind) ? "evidence" : kind === "Human decision" ? "decision" : "clarification";
  const diverse = [...gaps.filter((g, i) => gaps.findIndex((other) => category(other.kind) === category(g.kind)) === i), ...gaps];
  return {
    assignment: { "Working title": assignment.topic, Audience: assignment.audience, "Commercial objective": assignment.objective, "Funnel stage": assignment.funnelStage, CTA: assignment.cta },
    direction: { "Primary angle": brief.direction.primaryAngle, "Key message": brief.direction.keyMessage, "Desired reader shift": brief.direction.desiredShift },
    priorities: balanced.filter((item, i, all) => all.findIndex((other) => other.text === item.text) === i).slice(0, 5),
    evidence,
    gaps: diverse.filter((g, i, all) => all.findIndex((other) => other.detail === g.detail) === i).slice(0, 3),
    outline: brief.requirements.outline.length > 8 ? [...brief.requirements.outline.slice(0, 7), brief.requirements.outline.at(-1)!] : [...brief.requirements.outline],
    search: assignment.query.trim() && brief.search ? {
      Intent: brief.search.intent,
      ...Object.fromEntries([
        ["Question", brief.search.questions[0]],
        ["GEO / AEO", brief.search.answerConsiderations[0]],
        ["Topics", brief.search.entities.slice(0, 3).join(", ")],
      ].filter(([, text]) => text)),
    } : null,
  };
}

export function summaryMarkdown(result: Result) {
  const summary = selectSummary(result);
  const escape = (value: string) => value.replace(/[\\`*_{}\[\]<>#|]/g, "\\$&");
  const fields = (values: Record<string, string>) => Object.entries(values).map(([label, text]) => `- **${label}:** ${escape(text)}`).join("\n");
  const section = (title: string, text: string) => `## ${title}\n\n${text || "None identified. Review the full analysis."}\n\n`;
  return "# Strategic summary\n\nAI draft · Human review required\n\nSelected from the full brief. Source-supported means supported by supplied text, not independently verified.\n\n" +
    section("Assignment", fields(summary.assignment)) + section("Strategic direction", fields(summary.direction)) +
    section("Content priorities", summary.priorities.map((p) => `- **${p.label}:** ${escape(p.text)}`).join("\n")) +
    section("Evidence to use", summary.evidence.map((f) => `- **${escape(f.id)} · Source-supported:** ${escape(f.finding)} (${f.references.map((r) => escape(r.sourceId)).join(", ")})`).join("\n")) +
    section("Biggest gaps", summary.gaps.map((g) => `- **${g.kind}:** ${escape(g.detail)} Next step: ${escape(g.nextStep)}`).join("\n")) +
    section("Recommended structure", summary.outline.map((text, i) => `${i + 1}. ${escape(text)}`).join("\n")) +
    (summary.search ? section("Search / GEO", fields(summary.search)) : "");
}
