export const factors = [
  { id: "entity", label: "Entity & proposition clarity", weight: 15, rubric: "Explicit primary entity, purpose, proposition, subject, relevant terminology and intended audience where applicable. Ambiguous language should not require inference." },
  { id: "structure", label: "Answerability & structure", weight: 15, rubric: "Direct answers, accurate descriptive headings, concise explanations, clear sections, summaries and definitions. Use supplied measured headings. Do not reward FAQ markup alone." },
  { id: "evidence", label: "Evidence & attribution", weight: 20, rubric: "Proportionate support for substantive factual claims: attribution, contextualised data, first-party examples, case evidence and freshness where determinable. External citations are not required when claims do not need them." },
  { id: "citation", label: "Citation-worthiness", weight: 15, rubric: "Specific referenceable facts, original observations, useful definitions, expert explanations, first-party data or distinctive examples. Neither length nor a high grade predicts actual citation." },
  { id: "depth", label: "Topical/contextual depth", weight: 15, rubric: "Sufficient useful context, related concepts, specificity and necessary audience explanations for the apparent subject. Incorporate the optional target topic without treating it as proof. Do not reward keyword stuffing or unnecessary length." },
  { id: "trust", label: "Trust & authorship signals", weight: 10, rubric: "Observable organisation/author identity, relevant expertise context, provenance, ownership, about/contact details and dates where relevant. Use measured structured data as context, not verified reputation. Do not penalise irrelevant authorship signals for the page type." },
  { id: "technical", label: "Technical accessibility", weight: 10, rubric: "Measured public response, generic crawl directives, title, H1, canonical and extractable content. Bot-specific behaviour remains unknown." },
] as const;
export type FactorId = typeof factors[number]["id"];
export type ContentFactorId = Exclude<FactorId, "technical">;

export const scoring = {
  gradeMaximum: 4,
  technical: { response: 2, directives: 3, title: 1, h1: 1, content: 2, canonical: 1 },
  technicalThresholds: { titleCharacters: 3, mainCharacters: 500, unknownDirectivesRatio: 2 / 3, limitedContentRatio: .5 },
  priorityImpactMultiplier: 100,
  bands: [
    { minimum: 80, label: "Well structured", copy: "The page has strong observable readiness signals across clarity, structure, evidence, context and accessibility." },
    { minimum: 60, label: "Strong foundations", copy: "The page communicates its subject well, with targeted improvements available around authority, evidence, structure or depth." },
    { minimum: 40, label: "Developing", copy: "The page has useful foundations, but several gaps may make it harder to interpret, trust or reuse confidently." },
    { minimum: 0, label: "Weak foundations", copy: "Important signals that help systems understand and evaluate this page are missing or unclear." },
  ],
};
export function scoreBand(score: number) { return scoring.bands.find((band) => score >= band.minimum)!; }
export const limitation = "AI search systems use proprietary retrieval and ranking methods that change over time. This diagnostic evaluates observable readiness signals on the page. It cannot determine or guarantee whether a particular AI platform will surface, rank or cite it.";
export const strategyCopy = "If AI search matters to your content strategy, I can help identify where stronger content, evidence, structure or workflows would make the biggest difference.";
export const privacyCopy = "I'll use your email to send this report. I won't add you to a marketing list unless you separately choose to subscribe.";
