import { ActionLink, Section } from "@/components/primitives";
import { pageMetadata } from "@/lib/metadata";
import styles from "./lab.module.css";

export const metadata = pageMetadata("AI Lab", "/ai-lab/", "Tools and working examples that show how I use AI to improve content, conversion and marketing workflows.");

export default function AiLabPage() {
  return <Section className={styles.page} aria-labelledby="ai-lab-title">
    <header className={styles.intro}>
      <p className="section-eyebrow">AI LAB</p>
      <h1 id="ai-lab-title">Practical Content + AI systems</h1>
      <p className="hero-summary">Tools and working examples that show how I use AI to improve content, conversion and marketing workflows.</p>
    </header>
    <div className={styles.cards} data-reveal-group>
      <article className={styles.card} aria-labelledby="scan-title">
        <p className={`${styles.label} section-eyebrow`}>Free tool</p>
        <h2 id="scan-title">Website Friction Scan</h2>
        <p className={styles.description}>Find the clarity, trust, conversion and visibility problems weakening a webpage.</p>
        <ActionLink href="/website-friction-scan/" variant="text">Run the free scan</ActionLink>
      </article>
      <article className={styles.card} aria-labelledby="briefing-title">
        <p className={`${styles.label} section-eyebrow`}>Interactive demo</p>
        <h2 id="briefing-title">Content briefing system</h2>
        <p className={styles.description}>Turn assignments and source material into structured, evidence-led content briefs.</p>
        <ActionLink href="/ai-lab/content-briefing/" variant="text">View the demo</ActionLink>
      </article>
    </div>
  </Section>;
}
