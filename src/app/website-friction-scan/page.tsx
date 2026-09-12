import { pageMetadata } from "@/lib/metadata";
import ScanTool from "./tool";
import styles from "./scan.module.css";

export const metadata = pageMetadata("Free Website Friction Scan", "/website-friction-scan/", "Find the clarity, trust, conversion and content issues getting in the way of your webpage. Get a free first-pass Website Friction Scan from Andy Good.");
export default function FrictionScanPage() {
  return <div className={`container ${styles.page}`}>
    <header className={styles.hero}>
      <p className="section-eyebrow">Free website scan</p>
      <h1>What’s stopping this page from working harder?</h1>
      <p className="hero-summary">Enter a public webpage and I’ll show you where clarity, trust, conversion or visibility may be getting in the way.</p>
    </header>
    <ScanTool />
  </div>;
}
