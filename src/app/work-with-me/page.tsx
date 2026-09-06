import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/metadata";
import { offers } from "@/lib/site";

export const metadata = pageMetadata("Ways to work", "/work-with-me/", "[WAYS TO WORK META DESCRIPTION]");
export default function WaysToWorkPage() {
  return <PageShell title="Ways to work" placeholder="[WAYS TO WORK INTRO COPY]"><ul className="link-list">{offers.map(({ slug, title }) => <li key={slug}><Link href={`/work-with-me/${slug}/`}>{title}</Link></li>)}</ul></PageShell>;
}
