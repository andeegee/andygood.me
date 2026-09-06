import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;
export function generateStaticParams() { return [{ "case-study": "placeholder" }]; }
type Props = { params: Promise<{ "case-study": string }> };
export async function generateMetadata({ params }: Props) {
  if ((await params)["case-study"] !== "placeholder") notFound();
  return pageMetadata("[CASE STUDY TITLE]", "/work/placeholder/", "[CASE STUDY META DESCRIPTION]", true);
}
export default async function CaseStudyPage({ params }: Props) {
  if ((await params)["case-study"] !== "placeholder") notFound();
  return <PageShell title="[CASE STUDY TITLE]" placeholder="[CASE STUDY COPY]" back={{ href: "/work/", label: "Back to work" }} />;
}
