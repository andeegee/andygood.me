import { after } from "next/server";
import { gateSchema } from "@/lib/ai-search-readiness/schema";
import { deliverReadiness, unlockReport } from "@/lib/ai-search-readiness/server";
import { ensureConfigured, failure, privateHeaders, rateLimit, readBody } from "@/lib/friction-scan/controls";
import { ScanError } from "@/lib/friction-scan/analysis";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const parsed = gateSchema.safeParse(await readBody(request, 3000));
    if (!parsed.success) throw new ScanError("Enter a valid work email and complete a scan first.", 400);
    ensureConfigured("readiness");
    await rateLimit(request, parsed.data.action === "status" ? "readiness-status" : "readiness-email");
    const { report, status } = await unlockReport(parsed.data);
    if (parsed.data.action === "status") return Response.json({ status }, { headers: privateHeaders });
    if (status !== "sent") after(async () => {
      try { await deliverReadiness(parsed.data); }
      catch { console.warn("readiness_delivery_unconfirmed"); }
    });
    return Response.json({ report, status: status === "sent" ? "sent" : "pending" }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
