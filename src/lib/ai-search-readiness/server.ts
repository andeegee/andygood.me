import { randomUUID } from "node:crypto";
import { ScanError } from "../friction-scan/analysis";
import { fingerprint, redis } from "../friction-scan/controls";
import { resend, type EmailProvider } from "../friction-scan/email";
import { renderLead, renderReport } from "./email";
import type { DeliveryStatus, GateInput, Report } from "./schema";

export const retention = { initial: 1800, submitted: 2592000, retryHours: 23 };
type Binding = { emailHash: string; company: string; created: string };
const reportKey = (token: string) => `readiness:report:${token}`;
const bindingKey = (token: string) => `readiness:recipient:${token}`;
const deliveryKey = (token: string) => `readiness:delivery:${token}`;

export async function saveReport(report: Report, command = redis) {
  const token = randomUUID();
  await command(["SET", reportKey(token), JSON.stringify(report), "EX", retention.initial]);
  return token;
}
export async function unlockReport(data: GateInput, command = redis) {
  const raw = await command(["GET", reportKey(data.token)]);
  if (!raw) throw new ScanError("This scan has expired. Run the page scan again to request a report.", 410);
  const report = JSON.parse(String(raw)) as Report;
  let binding: Binding;
  if (data.action === "status") {
    const value = await command(["GET", bindingKey(data.token)]);
    if (!value) throw new ScanError("Submit your work email to unlock the report first.", 403);
    binding = JSON.parse(String(value));
  } else {
    const value = JSON.stringify({ emailHash: fingerprint(data.email), company: data.company, created: new Date().toISOString() });
    const stored = await command(["EVAL", "if redis.call('EXISTS',KEYS[2])==0 then return false end; local old=redis.call('GET',KEYS[1]); if old then return old end; redis.call('SET',KEYS[1],ARGV[1],'EX',ARGV[2]); return ARGV[1]", 2, bindingKey(data.token), reportKey(data.token), value, retention.submitted]);
    if (!stored) throw new ScanError("This scan has expired. Run the page scan again.", 410);
    binding = JSON.parse(String(stored));
  }
  if (binding.emailHash !== fingerprint(data.email)) throw new ScanError("This scan is already linked to another email address. Run a new scan to change the recipient.", 409);
  if (data.action !== "status") await command(["EXPIREAT", reportKey(data.token), Math.floor(Date.parse(binding.created) / 1000) + retention.submitted]);
  const status = await command(["GET", deliveryKey(data.token)]) as DeliveryStatus | null;
  if (data.action !== "status" && status !== "sent" && Date.now() - Date.parse(binding.created) > retention.retryHours * 3600000) throw new ScanError("The safe email retry window has ended. Run a new scan to request another report.", 410);
  return { report, binding, status: status || "pending" as DeliveryStatus };
}

export async function deliverReadiness(data: GateInput, provider: EmailProvider = resend, command = redis) {
  const { report, binding, status } = await unlockReport({ ...data, action: "status" }, command);
  if (status === "sent") return;
  if (Date.now() - Date.parse(binding.created) > retention.retryHours * 3600000) throw new ScanError("The safe email retry window has ended.", 410);
  const lockKey = `readiness:delivery-lock:${data.token}`;
  const lock = randomUUID();
  if (!(await command(["SET", lockKey, lock, "EX", 90, "NX"]))) return;
  const expires = Math.floor(Date.parse(binding.created) / 1000) + retention.submitted;
  try {
    await command(["SET", deliveryKey(data.token), "pending", "EXAT", expires]);
    if (!process.env.RESEND_API_KEY || !process.env.FRICTION_SCAN_FROM_EMAIL || !process.env.FRICTION_SCAN_LEAD_EMAIL) throw new Error("Email unavailable");
    await provider.send({ to: data.email, subject: `Your AI Search Readiness report: ${report.score}/100`, ...renderReport(report) }, `readiness-report-${data.token}`);
    await provider.send({ to: process.env.FRICTION_SCAN_LEAD_EMAIL, reply_to: data.email, subject: "AI SEARCH READINESS LEAD", ...renderLead(report, data.email, binding.company) }, `readiness-lead-${data.token}`);
    await command(["SET", deliveryKey(data.token), "sent", "EXAT", expires]);
  } catch {
    await command(["SET", deliveryKey(data.token), "failed", "EXAT", expires]);
  } finally {
    await command(["EVAL", "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0", 1, lockKey, lock]);
  }
}
