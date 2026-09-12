import { OfferPage } from "@/components/offer-page";
import { pageMetadata } from "@/lib/metadata";
import { content } from "./content";

const path = "/work-with-me/fractional-content-ai-strategy/";
export const metadata = pageMetadata(content.title, path, content.description);

export default function Page() {
  return <OfferPage content={content} path={path} />;
}
