import { submissionSchema } from "@/lib/content-workflow-diagnostic/server";
import { deliverDiagnostic } from "@/lib/content-workflow-diagnostic/server";
import { failure, rateLimit, readBody, privateHeaders } from "@/lib/friction-scan/controls";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const parsed = submissionSchema.safeParse(await readBody(request, 10000));
    if (!parsed.success) return Response.json({ error: "Complete the diagnostic and enter a valid work email." }, { status: 400, headers: privateHeaders });
    await rateLimit(request, "diagnostic");
    const result = await deliverDiagnostic(parsed.data);
    return Response.json({ submitted: true, result }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
