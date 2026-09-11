import { OfferPage } from "@/components/offer-page";
import { pageMetadata } from "@/lib/metadata";
import { content } from "./content";

export const metadata = pageMetadata(content.title, "/work-with-me/content-messaging-conversion/", content.description);

export default function Page() {
  return <OfferPage content={content} />;
}
