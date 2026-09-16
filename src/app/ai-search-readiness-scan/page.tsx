import { pageMetadata } from "@/lib/metadata";
import ScanTool from "./tool";
import base from "../website-friction-scan/scan.module.css";

export const metadata = pageMetadata("AI Search Readiness Scan", "/ai-search-readiness-scan/", "Scan a public webpage for observable signals that make content easier for AI systems to understand, trust and use. A readiness diagnostic, not a visibility prediction.");
export default function ReadinessScanPage() {
  return <div className={`container ${base.page}`}>
    <header className={base.hero}>
      <p className="section-eyebrow">AI SEARCH READINESS SCAN</p>
      <h1>Is this page ready for AI search?</h1>
      <p className="hero-summary">Scan a public webpage for the signals that make content easier for AI systems to understand, trust and use.</p>
      <p>Get an initial readiness score and your biggest weakness before entering your email.</p>
      <p className={base.note}>This is a readiness diagnostic, not a prediction of whether an AI platform will rank or cite your page.</p>
    </header>
    <ScanTool />
  </div>;
}
