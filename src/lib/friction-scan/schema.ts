import { z } from "zod";

export const inputSchema = z.object({
  url: z.string().trim().max(2048).url().refine((raw) => {
    try {
      const u = new URL(raw);
      return ["http:", "https:"].includes(u.protocol) && !u.username && !u.password && (!u.port || ["80", "443"].includes(u.port));
    } catch { return false; }
  }),
  goal: z.string().trim().min(3).max(500),
  audience: z.string().trim().max(300).default(""),
});
const prose = z.string().min(1).max(1300);
// Exact source quotations are checked again after schema validation.
const observation = z.object({ explanation: prose, quote: z.string().min(12).max(400) });
const friction = z.object({ heading: z.string().min(1).max(100), explanation: prose, whyItMatters: prose, quote: z.string().min(12).max(400) });
const area = z.object({ strongestPoint: observation, mainFriction: observation, recommendedImprovement: observation });
export const reportSchema = z.object({
  status: z.enum(["Strong", "Needs attention", "Significant friction"]),
  strengths: z.array(observation).min(1).max(2),
  frictionPoints: z.array(friction).length(3),
  fixFirst: observation,
  executiveSummary: observation,
  clarity: area,
  trust: area,
  conversion: area,
  visibility: area,
  priorityFixes: z.array(observation).min(1).max(5),
});
export type ScanInput = z.infer<typeof inputSchema>;
export type Report = z.infer<typeof reportSchema>;
export type Observation = z.infer<typeof observation>;
export type Preview = Pick<Report, "status" | "strengths" | "frictionPoints" | "fixFirst">;
export type ScanResponse = { preview: Preview; token: string; url: string; warnings: string[] };
export const emailSchema = z.object({ email: z.string().trim().toLowerCase().max(254).email(), token: z.string().min(20).max(120000) });
export const closingNote = "This is a first-pass automated diagnosis, not a substitute for a full strategic audit. The strongest improvements usually come from understanding the business, audience and commercial context behind the page.";
