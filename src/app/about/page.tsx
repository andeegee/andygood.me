import { PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("About", "/about/", "[ABOUT META DESCRIPTION]");
export default function AboutPage() { return <PageShell title="About" placeholder="[ABOUT COPY]" />; }
