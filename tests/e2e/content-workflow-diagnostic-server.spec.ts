import { test, expect } from "@playwright/test";
import { calculateResult, questions, scoreBand, type Answers } from "../../src/lib/content-workflow-diagnostic/config";
import { commercialFit, deliverDiagnostic, renderDiagnosticReport, submissionSchema } from "../../src/lib/content-workflow-diagnostic/server";
import type { EmailProvider } from "../../src/lib/friction-scan/email";
import type { redis } from "../../src/lib/friction-scan/controls";

const answers = (score: number) => Object.fromEntries(questions.map(({ id }) => [id, score])) as Answers;
const submission = { submissionId: "d58fa9bd-53ae-4a29-af3f-3fc982826b9b", email: "leader@example.com", company: "example.com", role: "Founder / CEO" as const, teamSize: "6–15" as const, monthlyOutput: "16–30" as const, answers: answers(0) };

test("scores, tie-breaking and risk rules are deterministic", () => {
  const low = calculateResult(answers(0));
  expect(low.overallScore).toBe(0);
  expect(low.maturityBand).toBe("Reactive");
  expect(low.primaryBottleneck).toBe("knowledge");
  expect(low.riskFlags.map(({ title }) => title)).toEqual(["Briefing gap", "Review bottleneck", "Knowledge reuse gap"]);
  expect(low.riskFlags).toHaveLength(3);
  const high = calculateResult(answers(3));
  expect(high.overallScore).toBe(100);
  expect(high.maturityBand).toBe("System-led");
  expect(high.primaryBottleneck).toBe("knowledge");
  expect([39, 40, 59, 60, 79, 80].map((value) => scoreBand(value).label)).toEqual(["Reactive", "Fragmented", "Fragmented", "Structured", "Structured", "System-led"]);
  const mixed = answers(3); mixed.q1 = 0; mixed.q2 = 0; mixed.q3 = 0; mixed.q4 = 1; mixed.q10 = 2;
  const result = calculateResult(mixed);
  expect(result.dimensionScores.strategy).toBe(0);
  expect(result.primaryBottleneck).toBe("strategy");
  expect(result.riskFlags[0].title).toBe("AI quality risk");
  for (const [changes, expected] of [
    [{ q4: 1, q10: 2 }, "AI quality risk"],
    [{ q7: 1 }, "Briefing gap"],
    [{ q8: 1, q13: 1 }, "Review bottleneck"],
    [{ q5: 1, q9: 1 }, "Knowledge reuse gap"],
    [{ q10: 1, q11: 1 }, "AI is still a tool, not a system"],
  ] as const) expect(calculateResult({ ...answers(3), ...changes }).riskFlags.map(({ title }) => title)).toContain(expected);
});

test("submission validation and commercial-fit scoring follow the supplied rules", () => {
  expect(submissionSchema.safeParse(submission).success).toBe(true);
  expect(submissionSchema.safeParse({ ...submission, email: "wrong" }).success).toBe(false);
  expect(submissionSchema.safeParse({ ...submission, answers: { ...submission.answers, q15: undefined } }).success).toBe(false);
  expect(submissionSchema.safeParse({ ...submission, answers: { ...submission.answers, extra: 2 } }).success).toBe(false);
  expect(commercialFit(submission, 59)).toBe("High potential");
  expect(commercialFit({ role: "Other", teamSize: "2–5", monthlyOutput: "16–30" }, 80)).toBe("Possible fit");
  expect(commercialFit({ role: "Other", teamSize: "Just me", monthlyOutput: "1–5 pieces" }, 80)).toBe("Low urgency");
});

test("delivery reuses email and Redis infrastructure without retaining the raw email", async () => {
  const originalEnv = { ...process.env };
  Object.assign(process.env, { RESEND_API_KEY: "test", FRICTION_SCAN_FROM_EMAIL: "Andy <sender@example.com>", FRICTION_SCAN_LEAD_EMAIL: "andy@example.com", FRICTION_SCAN_REDIS_URL: "https://redis.example.com", FRICTION_SCAN_REDIS_TOKEN: "test", FRICTION_SCAN_TOKEN_SECRET: "a".repeat(64) });
  const messages: Parameters<EmailProvider["send"]>[] = [];
  const commands: (string | number)[][] = [];
  const provider: EmailProvider = { async send(...args) { messages.push(args); } };
  const command: typeof redis = async (args) => { commands.push(args); return args[0] === "EVAL" ? args[4] : "OK"; };
  try {
    const result = await deliverDiagnostic(submission, provider, command);
    expect(result.overallScore).toBe(0);
    expect(messages).toHaveLength(2);
    expect(messages[0][0]).toMatchObject({ to: submission.email, subject: "Your Content Workflow Diagnostic | Andy Good" });
    expect(messages[1][0]).toMatchObject({ to: "andy@example.com", reply_to: submission.email, subject: "Content Workflow Diagnostic lead" });
    for (const value of [submission.email, submission.company, submission.role, "High potential", "Knowledge"]) expect(messages[1][0].text).toContain(value);
    const stored = String(commands.find((args) => args[0] === "SET")?.[2]);
    expect(stored).not.toContain(submission.email);
    expect(JSON.parse(stored)).toMatchObject({ company: submission.company, commercialFit: "High potential", answers: submission.answers });
    expect(commands.find((args) => args[0] === "SET")?.slice(-2)).toEqual(["EX", 2592000]);
    const report = renderDiagnosticReport(result);
    expect(report.text).toContain("Three priority improvements");
    expect(report.html).toContain("https://andygood.me/contact/");
  } finally { process.env = originalEnv; }
});
