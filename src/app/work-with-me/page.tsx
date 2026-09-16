import { ActionLink, Container } from "@/components/primitives";
import { pageMetadata } from "@/lib/metadata";
import { engagements } from "./offers";
import styles from "./work-with-me.module.css";

export const metadata = pageMetadata("Ways to Work", "/work-with-me/", "Work with Senior Content & AI Strategist Andy Good on messaging and conversion strategy, fractional content leadership or AI-enabled content systems.");

const involvement = [
  ["Strategic projects", "I can get hands-on with copy or content when it is strategically important to solving the defined commercial problem."],
  ["Fractional support", "The work stays focused on ongoing senior direction, prioritisation, ownership and oversight, not routine production."],
  ["Content systems", "Hands-on work is used to prototype, test and validate the system with real content, not to become the production team."],
];

export default function WaysToWorkPage() {
  return <div className={styles.page}>
    <section className={styles.hero} aria-labelledby="ways-title">
      <Container>
        <p className={`${styles.eyebrow} section-eyebrow`}>Ways to work</p>
        <h1 id="ways-title">The problem decides the shape of the work.</h1>
        <div className={styles.heroCopy}>
          <p>Different commercial problems need different kinds of intervention: a focused strategic project, ongoing senior direction or a redesign of the content system behind the work.</p>
          <p className={styles.heroConclusion}>Start with what is getting in the way. We can diagnose the right engagement from there.</p>
        </div>
      </Container>
    </section>

    <section className={styles.selector} aria-labelledby="selector-title">
      <Container>
        <header className={styles.sectionHeader} data-reveal>
          <p className={`${styles.eyebrow} section-eyebrow`}>Choose by problem</p>
          <h2 id="selector-title">What is getting in the way right now?</h2>
          <p>You do not need to diagnose the engagement. Pick the situation that sounds closest.</p>
        </header>
        <div className={styles.engagements} data-reveal-group>
          {engagements.map((engagement, index) => <article key={engagement.href} className={styles.engagement} aria-labelledby={`engagement-${index + 1}`}>
            <p className={styles.label}>{engagement.label}</p>
            <h3 id={`engagement-${index + 1}`}>{engagement.title}</h3>
            <p className={styles.summary}>{engagement.copy}</p>
            <ul>{engagement.symptoms.map(symptom => <li key={symptom}>{symptom}</li>)}</ul>
            <p className={styles.offerName}>{engagement.offer}</p>
            <ActionLink href={engagement.href} variant="secondary">{engagement.cta}</ActionLink>
          </article>)}
        </div>
      </Container>
    </section>

    <section className={styles.boundary} aria-labelledby="boundary-title">
      <Container data-reveal>
        <p className={`${styles.eyebrow} section-eyebrow`}>A useful distinction</p>
        <div className={styles.boundaryGrid}>
          <h2 id="boundary-title">Strategy problem or systems problem?</h2>
          <div className={styles.boundaryChoices}>
            <div><h3>Choose fractional support</h3><p>When the team needs ongoing senior direction, prioritisation, ownership and oversight.</p></div>
            <div><h3>Choose content systems</h3><p>When the work needs a substantial audit, redesign or implementation of the content operating system.</p></div>
            <p className={styles.secondary}>If the primary problem is broader business operations rather than content, marketing, messaging or growth, that work belongs under <a className="accent-link" href="https://allmi.online">allmi</a>.</p>
          </div>
        </div>
      </Container>
    </section>

    <section className={styles.involvement} aria-labelledby="involvement-title">
      <Container data-reveal>
        <div className={styles.involvementIntro}>
          <h2 id="involvement-title">Senior thinking. Practical involvement.</h2>
          <p>I work at strategy level, but stay close enough to the work to improve the outcome. The balance changes with the problem.</p>
        </div>
        <div className={styles.involvementGrid} data-reveal-group>{involvement.map(([title, copy]) => <div key={title}>
          <h3>{title}</h3><p>{copy}</p>
        </div>)}</div>
      </Container>
    </section>

    <section className={styles.closing} aria-labelledby="conversation-title">
      <Container data-reveal>
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
