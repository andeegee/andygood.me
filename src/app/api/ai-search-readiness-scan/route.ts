import { inputSchema } from "@/lib/ai-search-readiness/schema";
import { analyseReadiness, extractReadinessPage, previewReport } from "@/lib/ai-search-readiness/analysis";
import { saveReport } from "@/lib/ai-search-readiness/server";
import { ensureConfigured, failure, privateHeaders, rateLimit, readBody } from "@/lib/friction-scan/controls";
import { ScanError } from "@/lib/friction-scan/analysis";

export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await readBody(request, 5000));
    if (!parsed.success) throw new ScanError("Enter a valid public HTTP(S) page URL. The optional target topic must be 500 characters or fewer.", 400);
    ensureConfigured("readiness");
    await rateLimit(request, "readiness");
    const page = await extractReadinessPage(parsed.data.url, request.signal);
    const report = await analyseReadiness(parsed.data, page, request.signal);
    return Response.json({ token: await saveReport(report), preview: previewReport(report) }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
