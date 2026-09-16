import { z } from "zod";
import { inputSchema as frictionInput } from "../friction-scan/schema";
import type { FactorId } from "./config";

export const inputSchema = z.object({ url: frictionInput.shape.url, topic: z.string().trim().max(500).default("") }).strict();
const prose = z.string().trim().min(1).max(700);
export const findingSchema = z.object({
  grade: z.number().int().min(0).max(4),
  found: prose, why: prose, action: prose,
  quote: z.string().min(12).max(400),
  uncertainty: z.string().min(1).max(400),
  impact: z.number().int().min(0).max(3),
  effort: z.enum(["quick", "strategic", "none"]),
}).strict();
export const contentSchema = z.object({ entity: findingSchema, structure: findingSchema, evidence: findingSchema, citation: findingSchema, depth: findingSchema, trust: findingSchema }).strict();
export const modelSchema = contentSchema.extend({ assessable: z.boolean(), assessmentNote: prose }).strict();
export const gateSchema = z.object({
  token: z.uuid(), email: z.string().trim().toLowerCase().max(254).email(), company: z.string().trim().max(300).default(""),
  action: z.enum(["unlock", "status", "retry"]).default("unlock"),
}).strict();
export type ScanInput = z.infer<typeof inputSchema>;
export type ModelAnalysis = z.infer<typeof contentSchema>;
export type GateInput = z.infer<typeof gateSchema>;
export type FactorResult = Omit<z.infer<typeof findingSchema>, "grade"> & { id: FactorId; label: string; score: number; maximum: number };
export type Report = {
  url: string; topic: string; created: string; warnings: string[]; score: number; band: string; bandCopy: string;
  factors: FactorResult[]; weakest: FactorId; priorities: FactorId[]; quickWins: FactorId[]; strategic: FactorId[];
};
export type Preview = Pick<Report, "url" | "score" | "band" | "bandCopy" | "warnings" | "weakest"> & {
  factors: Pick<FactorResult, "id" | "label" | "score" | "maximum">[];
  opportunity: Pick<FactorResult, "label" | "found" | "action" | "uncertainty">;
};
export type ScanResponse = { token: string; preview: Preview };
export type DeliveryStatus = "pending" | "sent" | "failed";
