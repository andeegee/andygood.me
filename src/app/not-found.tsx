import { PageShell } from "@/components/page-shell";
import { ActionLink } from "@/components/primitives";

export default function NotFound() {
  return <PageShell title="Page not found" placeholder="This page could not be found."><ActionLink href="/">Home</ActionLink></PageShell>;
}
