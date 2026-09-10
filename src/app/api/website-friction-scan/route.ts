import { inputSchema } from "@/lib/friction-scan/schema";
import { analyse, extractPage, ScanError } from "@/lib/friction-scan/analysis";
import { ensureConfigured, failure, privateHeaders, rateLimit, readBody } from "@/lib/friction-scan/controls";
import { seal } from "@/lib/friction-scan/token";
import { reportSections } from "@/lib/friction-scan/email";

export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await readBody(request, 5000));
    if (!parsed.success) throw new ScanError("Enter a valid public HTTP(S) URL and a page goal of at least three characters. Check the field length limits.", 400);
    ensureConfigured();
    await rateLimit(request, "scan");
    const page = await extractPage(parsed.data.url, request.signal);
    const report = await analyse(parsed.data, page, request.signal);
    const data = { input: parsed.data, url: page.url, warnings: page.warnings, report };
    const reportWords = reportSections({ ...data, id: "", expires: 0, created: "" }).flat().join(" ").split(/\s+/).length;
    if (reportWords > 1200) throw new ScanError("The analysis returned an overlong report. Please retry.");
    const { status, strengths, frictionPoints, fixFirst } = report;
    return Response.json({ preview: { status, strengths, frictionPoints, fixFirst }, token: seal(data), url: page.url, warnings: page.warnings }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
