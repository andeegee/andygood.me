export const dimensions = ["strategy", "knowledge", "workflow", "aiReadiness", "qualityControl"] as const;
export type Dimension = (typeof dimensions)[number];

export const dimensionLabels: Record<Dimension, string> = {
  strategy: "Strategy",
  knowledge: "Knowledge",
  workflow: "Workflow",
  aiReadiness: "AI readiness",
  qualityControl: "Quality control",
};

export const stages = [
  { id: "about", label: "About your content operation" },
  ...dimensions.map((id) => ({ id, label: dimensionLabels[id] })),
] as const;

export const contextOptions = {
  role: ["Founder / CEO", "CMO / marketing leader", "Head of Content / Content Lead", "Content / marketing team member", "Agency / consultant", "Other"],
  teamSize: ["Just me", "2–5", "6–15", "16+"],
  monthlyOutput: ["1–5 pieces", "6–15", "16–30", "30+"],
} as const;

export const answerScores = [0, 1, 2, 3] as const;

export const questions = [
  {
    id: "q1", number: 1, dimension: "strategy", prompt: "How consistently does content start with a clear commercial objective?",
    choices: ["Usually starts with “we need some content”", "Objectives are discussed, but not consistently defined", "Most work has a clear objective", "Every meaningful piece is tied to a defined commercial outcome"],
  },
  {
    id: "q2", number: 2, dimension: "strategy", prompt: "How clear are your content priorities?",
    choices: ["Work is mostly driven by requests and deadlines", "We have a plan, but priorities shift frequently", "We prioritise based on audience and business needs", "We have a clear framework for deciding what deserves resources"],
  },
  {
    id: "q3", number: 3, dimension: "strategy", prompt: "How early are conversion, search and distribution considered?",
    choices: ["Mostly after the content has been created", "They are considered inconsistently", "They are usually part of the brief", "They are designed into the content from the start"],
  },
  {
    id: "q4", number: 4, dimension: "knowledge", prompt: "How organised is the knowledge your team uses to create content?",
    choices: ["Mostly scattered across people, chats and documents", "Important information exists, but finding it is difficult", "Most core knowledge is documented and accessible", "We have a maintained source of truth for content and marketing"],
  },
  {
    id: "q5", number: 5, dimension: "knowledge", prompt: "How reliable and current are your source materials?",
    choices: ["Writers often have to search for information themselves", "Useful sources exist, but quality and currency vary", "Most work begins with reliable source material", "Sources are curated, maintained and deliberately reused"],
  },
  {
    id: "q6", number: 6, dimension: "knowledge", prompt: "How clearly do you distinguish evidence from assumptions?",
    choices: ["We generally do not", "It depends on the person producing the content", "Important claims are usually checked", "Evidence, inference and unsupported claims are explicitly separated"],
  },
  {
    id: "q7", number: 7, dimension: "workflow", prompt: "How effective are your content briefs?",
    choices: ["Briefs are minimal or inconsistent", "They provide basic direction but leave significant gaps", "They usually give creators what they need", "They consistently provide strategic, audience, evidence and execution clarity"],
  },
  {
    id: "q8", number: 8, dimension: "workflow", prompt: "How clear are ownership and handoffs?",
    choices: ["Work regularly gets stuck or bounced around", "People generally know what to do, but bottlenecks are common", "Roles and approval stages are mostly clear", "Ownership, handoffs and approvals are deliberately designed"],
  },
  {
    id: "q9", number: 9, dimension: "workflow", prompt: "How systematically do you reuse existing content and knowledge?",
    choices: ["We frequently start from scratch", "People reuse material when they remember it exists", "Repurposing is part of our process", "Content and source knowledge are deliberately structured for reuse"],
  },
  {
    id: "q10", number: 10, dimension: "aiReadiness", prompt: "What does AI usually work from?",
    choices: ["Mostly generic prompts", "People manually paste in useful context", "We have reusable prompts/templates with relevant context", "AI works from structured, approved knowledge and workflow inputs"],
  },
  {
    id: "q11", number: 11, dimension: "aiReadiness", prompt: "How repeatable is your use of AI?",
    choices: ["Everyone uses it differently", "We have some shared prompts or approaches", "Repeatable AI-assisted processes exist for important tasks", "AI is deliberately integrated into defined workflows"],
  },
  {
    id: "q12", number: 12, dimension: "aiReadiness", prompt: "Where does human judgement sit in your AI-assisted work?",
    choices: ["It is largely up to the individual", "People review AI output, but standards vary", "Important work has defined human review points", "Strategic judgement, verification and approval are explicitly built into the system"],
  },
  {
    id: "q13", number: 13, dimension: "qualityControl", prompt: "How consistently is content reviewed against defined standards?",
    choices: ["Review is mostly subjective", "Review depends heavily on the reviewer", "We have agreed quality expectations", "We use consistent criteria covering accuracy, brand, strategy and performance"],
  },
  {
    id: "q14", number: 14, dimension: "qualityControl", prompt: "What happens to performance learnings?",
    choices: ["Very little", "People remember lessons informally", "Results influence future content decisions", "Learnings systematically feed back into strategy, briefs, knowledge and workflows"],
  },
  {
    id: "q15", number: 15, dimension: "qualityControl", prompt: "How well do you manage AI-related content risk?",
    choices: ["We largely rely on individual judgement", "People know to check AI output, but there is no standard process", "Important claims and risks have defined checks", "Accuracy, source verification, brand risk and human approval are governed consistently"],
  },
] as const;

export type QuestionId = (typeof questions)[number]["id"];
export type Answers = Record<QuestionId, number>;

export const scoreBands = [
  { min: 0, max: 39, label: "Reactive" },
  { min: 40, max: 59, label: "Fragmented" },
  { min: 60, max: 79, label: "Structured" },
  { min: 80, max: 100, label: "System-led" },
] as const;

export const dimensionInterpretations: Record<Dimension, string> = {
  strategy: "How clearly content connects to commercial goals, priorities, conversion and distribution.",
  knowledge: "How accessible, reliable and clearly evidenced the sources behind content are.",
  workflow: "How consistently briefs, ownership, handoffs and reuse support delivery.",
  aiReadiness: "How reliably AI works from defined inputs, repeatable processes and human review.",
  qualityControl: "How consistently standards, performance learning and AI risks are governed.",
};

export const diagnosisCopy: Record<Dimension, string> = {
  strategy: "Content activity is happening without enough shared clarity about what deserves attention and why. That makes prioritisation harder and encourages output rather than commercial focus.",
  knowledge: "The information feeding your content operation is fragmented or unreliable. That creates repeated research, inconsistencies and avoidable rewriting, particularly when AI is involved.",
  workflow: "Too much of the process depends on informal handoffs and individual judgement. Work is likely losing time between briefing, production, review and approval.",
  aiReadiness: "AI is being used more as an individual productivity tool than as part of a dependable content system. That limits consistency and makes results heavily dependent on who is prompting it.",
  qualityControl: "Quality relies too heavily on the person reviewing the work rather than on shared standards. That makes consistency difficult and can create unnecessary revision cycles.",
};

export const recommendations: Record<Dimension, string> = {
  strategy: "Define the decision framework before adding more activity. Tie important content to audience, commercial objective, conversion role and distribution from the start.",
  knowledge: "Create one maintained source layer for positioning, audience knowledge, product facts, evidence and approved claims.",
  workflow: "Map the path from request to published content, then remove unclear ownership, repeated decisions and unnecessary review loops.",
  aiReadiness: "Connect AI to defined inputs, approved knowledge and repeatable tasks before introducing more tools or prompts.",
  qualityControl: "Define what good looks like across accuracy, positioning, brand, evidence and commercial purpose, then build those checks into the workflow.",
};

type Condition = { question: QuestionId; lte?: number; gte?: number };
type Rule = { id: string; title: string; copy: string; conditions: readonly Condition[]; match?: "all" | "any" };

export const riskRules = [
  { id: "ai-quality-risk", title: "AI quality risk", copy: "Your team is increasing AI use faster than it is improving the knowledge AI works from. Better prompting alone is unlikely to solve that.", conditions: [{ question: "q4", lte: 1 }, { question: "q10", gte: 2 }] },
  { id: "briefing-gap", title: "Briefing gap", copy: "Too much strategic judgement is being deferred until production and review. Improving the brief could remove work later in the process.", conditions: [{ question: "q7", lte: 1 }] },
  { id: "review-bottleneck", title: "Review bottleneck", copy: "Weak handoffs combined with inconsistent quality standards are likely creating unnecessary revision cycles.", conditions: [{ question: "q8", lte: 1 }, { question: "q13", lte: 1 }] },
  { id: "knowledge-reuse-gap", title: "Knowledge reuse gap", copy: "Useful research and existing content are being lost instead of becoming reusable organisational knowledge.", conditions: [{ question: "q5", lte: 1 }, { question: "q9", lte: 1 }] },
  { id: "ai-tool-not-system", title: "AI is still a tool, not a system", copy: "Individual prompting may save time, but it is not yet creating a repeatable organisational advantage.", conditions: [{ question: "q10", lte: 1 }, { question: "q11", lte: 1 }] },
] as const satisfies readonly Rule[];

export const aiOpportunityRules = [
  { id: "approved-knowledge", title: "Knowledge", copy: "Where approved sources, product information, positioning, audience insight and institutional knowledge live.", conditions: [{ question: "q4", lte: 1 }, { question: "q5", lte: 1 }], match: "any" },
  { id: "structured-briefing", title: "Briefing", copy: "How strategic intent becomes clear, repeatable instructions for people and AI.", conditions: [{ question: "q7", lte: 1 }] },
  { id: "knowledge-reuse", title: "Reuse", copy: "How strong work becomes reusable knowledge rather than disappearing into folders and old documents.", conditions: [{ question: "q9", lte: 1 }] },
  { id: "repeatable-review", title: "Review", copy: "How quality, accuracy, positioning, search and human judgement are protected before publication.", conditions: [{ question: "q13", lte: 1 }, { question: "q15", lte: 1 }], match: "any" },
  { id: "defined-ai-workflows", title: "AI-assisted workflow", copy: "AI can accelerate research, organise knowledge, suggest structure and remove repetitive work.", conditions: [{ question: "q10", lte: 1 }, { question: "q11", lte: 1 }] },
] as const satisfies readonly Rule[];

export const bottleneckTiePriority = ["knowledge", "workflow", "strategy", "qualityControl", "aiReadiness"] as const satisfies readonly Dimension[];

function matches(rule: Rule, answers: Answers) {
  const checks = rule.conditions.map(({ question, lte, gte }) => (lte === undefined || answers[question] <= lte) && (gte === undefined || answers[question] >= gte));
  return rule.match === "any" ? checks.some(Boolean) : checks.every(Boolean);
}

export function scoreBand(score: number) {
  return scoreBands.find(({ min, max }) => score >= min && score <= max) ?? scoreBands[scoreBands.length - 1];
}

export function calculateResult(answers: Answers) {
  const dimensionScores = Object.fromEntries(dimensions.map((dimension) => {
    const sum = questions.filter((question) => question.dimension === dimension).reduce((total, question) => total + answers[question.id], 0);
    return [dimension, Math.round((sum / 9) * 100)];
  })) as Record<Dimension, number>;
  const overallScore = Math.round(dimensions.reduce((sum, dimension) => sum + dimensionScores[dimension], 0) / dimensions.length);
  const ranked = [...bottleneckTiePriority].sort((a, b) => dimensionScores[a] - dimensionScores[b]);
  const primaryBottleneck = ranked[0];
  return {
    overallScore,
    maturityBand: scoreBand(overallScore).label,
    dimensionScores,
    primaryBottleneck,
    primaryDiagnosis: diagnosisCopy[primaryBottleneck],
    immediateRecommendation: recommendations[primaryBottleneck],
    riskFlags: riskRules.filter((rule) => matches(rule, answers)).slice(0, 3).map(({ id, title, copy }) => ({ id, title, copy })),
    priorities: ranked.slice(0, 3).map((dimension) => ({ dimension, label: dimensionLabels[dimension], recommendation: recommendations[dimension] })),
    aiOpportunities: aiOpportunityRules.filter((rule) => matches(rule, answers)).slice(0, 3).map(({ id, title, copy }) => ({ id, title, copy })),
  };
}

export type DiagnosticResult = ReturnType<typeof calculateResult>;
