import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { inputSchema, reportSchema } from "./schema";
import { ScanError } from "./analysis";

const payloadSchema = z.object({ id: z.string().uuid(), expires: z.number(), created: z.string(), input: inputSchema, url: z.string().url(), warnings: z.array(z.string()), report: reportSchema });
export type ReportPayload = z.infer<typeof payloadSchema>;
function key() {
  const raw = process.env.FRICTION_SCAN_TOKEN_SECRET || "";
  if (!/^[a-f0-9]{64}$/i.test(raw)) throw new ScanError("The scan is not configured yet.", 503);
  return Buffer.from(raw, "hex");
}
export function seal(data: Omit<ReportPayload, "id" | "expires" | "created">) {
  const payload = { ...data, id: randomUUID(), expires: Date.now() + 30 * 60 * 1000, created: new Date().toISOString() };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function unseal(token: string): ReportPayload {
  try {
    const raw = Buffer.from(token, "base64url");
    const cipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    cipher.setAuthTag(raw.subarray(12, 28));
    const data = payloadSchema.parse(JSON.parse(Buffer.concat([cipher.update(raw.subarray(28)), cipher.final()]).toString("utf8")));
    if (data.expires < Date.now()) throw new Error("Expired");
    return data;
  } catch { throw new ScanError("This scan has expired or could not be verified. Scan the page again to request the report.", 410); }
}
