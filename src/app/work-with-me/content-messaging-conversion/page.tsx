import { OfferPage } from "@/components/offer-page";
import { pageMetadata } from "@/lib/metadata";
import { offers } from "@/lib/site";

const offer = offers[0];
export const metadata = pageMetadata(offer.title, `/work-with-me/${offer.slug}/`, "[CONTENT, MESSAGING & CONVERSION META DESCRIPTION]");
export default function Page() { return <OfferPage title={offer.title} placeholder="[CONTENT, MESSAGING & CONVERSION COPY]" />; }
