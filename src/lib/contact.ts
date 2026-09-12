import { z } from "zod";

export const contactTopics = [
  "Messaging, content or conversion",
  "Fractional Content & AI Strategy",
  "AI-enabled content systems",
  "Senior copywriting",
  "Something else / not sure",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100, "Use 100 characters or fewer."),
  email: z.string().trim().max(254, "Use 254 characters or fewer.").email("Enter a valid email address."),
  company: z.string().trim().max(150, "Use 150 characters or fewer.").optional().default(""),
  topic: z.enum(contactTopics, { error: "Choose what you need help with." }),
  message: z.string().trim().min(1, "Enter your message.").max(5000, "Use 5,000 characters or fewer."),
  website: z.string().max(200).optional().default(""),
  submissionId: z.uuid(),
});

export type ContactErrors = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;
export function contactErrors(error: z.ZodError): ContactErrors {
  return Object.fromEntries(error.issues.map((issue) => [issue.path[0], issue.message]));
}
