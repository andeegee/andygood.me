import { PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Contact", "/contact/", "[CONTACT META DESCRIPTION]");
export default function ContactPage() { return <PageShell title="Contact" placeholder="[CONTACT COPY AND APPROVED CONTACT METHOD]" />; }
