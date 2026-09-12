import { ActionLink, Container } from "@/components/primitives";
import styles from "./offer-page.module.css";

type OfferLink = { label: string; href: string };
type Area = { title: string; copy: string };
type OfferSection = {
  eyebrow: string;
  heading: string;
  tone: "white" | "fog" | "dark";
  statement?: string;
  links?: OfferLink[];
} & (
  | { kind: "prose"; paragraphs: string[] }
  | { kind: "list"; items: string[] }
  | { kind: "areas" | "stages"; areas: Area[] }
);
export type OfferContent = {
  title: string;
  description: string;
  variant: "project" | "fractional" | "systems";
  hero: { eyebrow: string; heading: string; lead: string[]; paragraphs: string[]; selectedWork: boolean };
  sections: OfferSection[];
  closing: { heading: string; paragraphs: string[] };
};

function Prose({ paragraphs }: { paragraphs: string[] }) {
  return <div className={styles.prose}>{paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>;
}

function DetailSection({ section, index }: { section: OfferSection; index: number }) {
  const id = `offer-section-${index}`;
  const wide = section.kind === "areas" || section.kind === "stages";
  return <section className={`${styles.section} ${styles[section.tone]} ${wide ? styles.wide : ""}`} aria-labelledby={id}>
    <Container>
      <div className={styles.sectionGrid}>
        <header data-reveal>
          <p className={`${styles.eyebrow} section-eyebrow`}>{section.eyebrow}</p>
          <h2 id={id}>{section.heading}</h2>
        </header>
        <div className={styles.sectionBody} data-reveal>
          {section.kind === "prose" && <Prose paragraphs={section.paragraphs} />}
          {section.kind === "list" && <ul className={styles.fitList}>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
          {section.kind === "areas" && <div className={styles.areas} data-reveal-group>{section.areas.map(area => <div className={styles.area} key={area.title}>
            <h3>{area.title}</h3><p>{area.copy}</p>
          </div>)}</div>}
          {section.kind === "stages" && <ol className={styles.stages} data-reveal-group>{section.areas.map((area, step) => <li key={area.title}>
            <span className={styles.number} aria-hidden="true">{String(step + 1).padStart(2, "0")}</span>
            <div><h3>{area.title}</h3><p>{area.copy}</p></div>
          </li>)}</ol>}
          {section.statement && <p className={styles.statement}>{section.statement}</p>}
          {section.links && <div className={styles.related}>{section.links.map(link => <ActionLink key={link.href} href={link.href} variant="text">{link.label}</ActionLink>)}</div>}
        </div>
      </div>
    </Container>
  </section>;
}

export function OfferPage({ content }: { content: OfferContent }) {
  return <div className={`${styles.page} ${styles[content.variant]}`}>
    <section className={styles.hero} aria-labelledby="page-title">
      <Container>
        <ActionLink href="/work-with-me/" variant="text" className={styles.back}>Ways to work</ActionLink>
        <p className={`${styles.eyebrow} section-eyebrow`}>{content.hero.eyebrow}</p>
        <h1 id="page-title">{content.hero.heading}</h1>
        <div className={styles.heroDetails}>
          <div className={styles.lead}><Prose paragraphs={content.hero.lead} /></div>
          {content.hero.paragraphs.length > 0 && <Prose paragraphs={content.hero.paragraphs} />}
        </div>
        <div className={styles.actions}>
          <ActionLink href="/contact/" className={styles.primary}>Start a conversation</ActionLink>
          {content.hero.selectedWork && <ActionLink href="/work/" variant="text">View selected work</ActionLink>}
        </div>
      </Container>
    </section>
    {content.sections.map((section, index) => <DetailSection key={section.eyebrow} section={section} index={index} />)}
    <section className={`${styles.section} ${styles.dark} ${styles.closing}`} aria-labelledby="offer-contact-title">
      <Container data-reveal>
        <h2 id="offer-contact-title">{content.closing.heading}</h2>
        {content.closing.paragraphs.length > 0 && <Prose paragraphs={content.closing.paragraphs} />}
        <ActionLink href="/contact/" className={styles.primary}>Start a conversation</ActionLink>
      </Container>
    </section>
  </div>;
}
