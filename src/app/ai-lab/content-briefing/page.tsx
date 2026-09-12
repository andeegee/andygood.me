import type { Metadata } from "next";
import { BriefingTool } from "./tool";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Content briefing lab",
  description: "Internal evidence-led content briefing workspace.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
};

export default function ContentBriefingPage() { return <BriefingTool />; }
