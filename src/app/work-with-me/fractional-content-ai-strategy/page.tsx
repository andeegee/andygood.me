import { OfferPage } from "@/components/offer-page";
import { pageMetadata } from "@/lib/metadata";
import { offers } from "@/lib/site";

const offer = offers[1];
export const metadata = pageMetadata(offer.title, `/work-with-me/${offer.slug}/`, "[FRACTIONAL CONTENT & AI STRATEGY META DESCRIPTION]");
export default function Page() { return <OfferPage title={offer.title} placeholder="[FRACTIONAL CONTENT & AI STRATEGY COPY]" />; }
