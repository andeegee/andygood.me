import { createHash } from "node:crypto";
import { contactSchema, contactErrors } from "@/lib/contact";
import { resend } from "@/lib/friction-scan/email";
import { readBody, failure, privateHeaders } from "@/lib/friction-scan/controls";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await readBody(request, 40000); }
  catch (error) { return failure(error); }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check the highlighted fields.", errors: contactErrors(parsed.error) }, { status: 400, headers: privateHeaders });
  const data = parsed.data;
  if (data.website) return Response.json({ sent: true }, { headers: privateHeaders });
  if (!process.env.RESEND_API_KEY || !process.env.FRICTION_SCAN_FROM_EMAIL) {
    return Response.json({ error: "The form is temporarily unavailable. Please email letschat@andygood.me." }, { status: 503, headers: privateHeaders });
  }
  try {
    // Identical retries reuse the provider key; editing the message creates a new key.
    const key = createHash("sha256").update(JSON.stringify(data)).digest("hex");
    await resend.send({
      to: "letschat@andygood.me",
      reply_to: data.email,
      subject: `Contact enquiry: ${data.topic}`,
      text: `Name: ${data.name}\nWork email: ${data.email}\nCompany: ${data.company || "Not supplied"}\nHelp with: ${data.topic}\n\n${data.message}`,
    }, `contact-${key}`);
    return Response.json({ sent: true }, { headers: privateHeaders });
  } catch {
    return Response.json({ error: "Sending could not be confirmed. Your message is still here. Please try again, or email letschat@andygood.me." }, { status: 502, headers: privateHeaders });
  }
}
