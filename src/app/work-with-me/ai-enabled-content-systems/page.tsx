import { OfferPage } from "@/components/offer-page";
import { pageMetadata } from "@/lib/metadata";
import { offers } from "@/lib/site";

const offer = offers[2];
export const metadata = pageMetadata(offer.title, `/work-with-me/${offer.slug}/`, "[AI-ENABLED CONTENT SYSTEMS META DESCRIPTION]");
export default function Page() { return <OfferPage title={offer.title} placeholder="[AI-ENABLED CONTENT SYSTEMS COPY]" />; }
