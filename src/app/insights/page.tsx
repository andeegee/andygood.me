import { PageShell } from "@/components/page-shell";
import { ActionLink } from "@/components/primitives";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Insights", "/insights/", "[INSIGHTS META DESCRIPTION]");
export default function InsightsPage() {
  return <PageShell title="Insights" placeholder="[INSIGHTS COPY]"><ActionLink href="/insights/placeholder/" variant="text">[ARTICLE PLACEHOLDER]</ActionLink></PageShell>;
}
