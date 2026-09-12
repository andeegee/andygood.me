import { ActionLink, Container } from "@/components/primitives";
import { pageMetadata } from "@/lib/metadata";
import { engagements } from "./offers";
import styles from "./work-with-me.module.css";

export const metadata = pageMetadata("Ways to Work", "/work-with-me/", "Work with Senior Content & AI Strategist Andy Good on messaging and conversion strategy, fractional content leadership or AI-enabled content systems.");

const principles = [
  ["Diagnose before prescribing", "I do not arrive with a preferred tool, tactic or deliverable. We work out what is actually causing the problem first."],
  ["Stay close to the commercial objective", "Content only matters if it helps the business communicate, convert, grow or operate better."],
  ["Get hands-on where it adds value", "Strategy should not mean standing at a distance from the work. If direct involvement materially improves the outcome, I get involved."],
  ["Use AI where it earns its place", "Not because the project needs an AI label. Because it genuinely improves the way the work gets done."],
];

export default function WaysToWorkPage() {
  return <div className={styles.page}>
    <section className={styles.hero} aria-labelledby="ways-title">
      <Container>
        <p className={`${styles.eyebrow} section-eyebrow`}>Ways to work</p>
        <h1 id="ways-title">The problem decides the shape of the work.</h1>
        <div className={styles.heroCopy}>
          <div className={styles.prose}>
            <p>Sometimes you need a focused strategic intervention.</p>
            <p>Sometimes you need senior thinking in the room on an ongoing basis.</p>
            <p>And sometimes the real problem is the system behind the content.</p>
          </div>
          <p className={styles.heroConclusion}>Three ways to work with me. One objective: better commercial decisions and better work.</p>
        </div>
      </Container>
    </section>
    {engagements.map((offer, index) => <section key={offer.href} className={`${styles.offer} ${index === 1 ? styles.dark : ""}`} aria-labelledby={`offer-${index + 1}`}>
      <Container>
        <p className={`${styles.eyebrow} section-eyebrow`}>{offer.label}</p>
        <div className={styles.offerHeading}>
          <h2 id={`offer-${index + 1}`}>{offer.title}</h2>
          <div className={styles.lead}>{offer.lead.map(p => <p key={p}>{p}</p>)}</div>
        </div>
        <div className={styles.offerBody}>
          <div>
            <div className={styles.prose}>{offer.body.map(p => <p key={p}>{p}</p>)}</div>
            <div className={styles.note}>
              {offer.noteTitle && <h3>{offer.noteTitle}</h3>}
              {offer.note.map(p => <p key={p}>{p}</p>)}
            </div>
          </div>
          <div className={styles.scope}>
            <h3>Typical scope</h3>
            <ul>{offer.scope.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
        <div className={styles.offerFooter}>
          <p><strong>Best for:</strong> {offer.best}</p>
          <ActionLink href={offer.href} variant="secondary" className={styles.offerLink}>{offer.cta}</ActionLink>
        </div>
      </Container>
    </section>)}
    <section className={styles.boundary} aria-labelledby="boundary-title">
      <Container>
        <p className={`${styles.eyebrow} section-eyebrow`}>A useful distinction</p>
        <div className={styles.boundaryGrid}>
          <h2 id="boundary-title">Strategy problem or systems problem?</h2>
          <div className={styles.prose}>
            <p>Fractional strategy can identify and oversee improvements to how the team works.</p>
            <p>But when the work becomes a substantial audit, redesign or implementation of the content operating system, it becomes an AI-Enabled Content Systems engagement.</p>
            <p className={styles.secondary}>And if the primary problem is broader business operations rather than content, marketing, messaging or growth, that work belongs under <a className="accent-link" href="https://allmi.online">allmi</a>.</p>
          </div>
        </div>
      </Container>
    </section>
    <section className={styles.principles} aria-labelledby="principles-title">
      <Container>
        <h2 id="principles-title">Senior thinking. Practical involvement.</h2>
        <div className={styles.principleGrid}>{principles.map(([title, copy]) => <div key={title}>
          <h3>{title}</h3><p>{copy}</p>
        </div>)}</div>
      </Container>
    </section>
    <section className={`${styles.closing} ${styles.dark}`} aria-labelledby="conversation-title">
      <Container>
        <h2 id="conversation-title">Not sure which one fits?</h2>
        <div className={styles.prose}>
          <p>Most good projects do not arrive neatly labelled.</p>
          <p>Tell me what is getting in the way. We can work out the right shape from there.</p>
        </div>
        <ActionLink href="/contact/" className={styles.contactLink}>Start a conversation</ActionLink>
      </Container>
    </section>
  </div>;
}
