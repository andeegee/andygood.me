import { emailSchema } from "@/lib/friction-scan/schema";
import { ScanError } from "@/lib/friction-scan/analysis";
import { ensureConfigured, failure, privateHeaders, rateLimit, readBody } from "@/lib/friction-scan/controls";
import { unseal } from "@/lib/friction-scan/token";
import { deliver } from "@/lib/friction-scan/email";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const parsed = emailSchema.safeParse(await readBody(request, 125000));
    if (!parsed.success) throw new ScanError("Enter a valid email address and complete a scan first.", 400);
    ensureConfigured();
    const data = unseal(parsed.data.token);
    await rateLimit(request, "email");
    await deliver(data, parsed.data.email);
    return Response.json({ message: "Your report has been sent. Check your inbox and spam folder." }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
