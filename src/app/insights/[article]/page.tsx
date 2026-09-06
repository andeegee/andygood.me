import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;
export function generateStaticParams() { return [{ article: "placeholder" }]; }
type Props = { params: Promise<{ article: string }> };
export async function generateMetadata({ params }: Props) {
  if ((await params).article !== "placeholder") notFound();
  return pageMetadata("[ARTICLE TITLE]", "/insights/placeholder/", "[ARTICLE META DESCRIPTION]", true);
}
export default async function ArticlePage({ params }: Props) {
  if ((await params).article !== "placeholder") notFound();
  return <article><PageShell title="[ARTICLE TITLE]" placeholder="[ARTICLE COPY]" back={{ href: "/insights/", label: "Back to insights" }} /></article>;
}
