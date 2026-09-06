import { PageShell } from "@/components/page-shell";
import { ActionLink } from "@/components/primitives";

export function OfferPage({ title, placeholder }: { title: string; placeholder: string }) {
  return <PageShell title={title} placeholder={placeholder} back={{ href: "/work-with-me/", label: "Ways to work" }}><ActionLink href="/contact/">Contact</ActionLink></PageShell>;
}
