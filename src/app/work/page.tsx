import { PageShell } from "@/components/page-shell";
import { ActionLink } from "@/components/primitives";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Work", "/work/", "[WORK META DESCRIPTION]");
export default function WorkPage() {
  return <PageShell title="Work" placeholder="[SELECTED WORK]"><ActionLink href="/work/placeholder/" variant="text">[CASE STUDY PLACEHOLDER]</ActionLink></PageShell>;
}
