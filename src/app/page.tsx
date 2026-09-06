import type { Metadata } from "next";
import { ActionLink, Container, Section } from "@/components/primitives";
import { pageMetadata } from "@/lib/metadata";
import styles from "./home.module.css";

const title = "Andy Good | Senior Content & AI Strategist";
const baseMetadata = pageMetadata(
  "Andy Good",
  "/",
  "Senior Content & AI Strategist helping SaaS and technology teams improve messaging, content performance, conversion and AI-enabled content systems.",
);

export const metadata: Metadata = {
  ...baseMetadata,
  title: { absolute: title },
  openGraph: { ...baseMetadata.openGraph, title },
  twitter: { ...baseMetadata.twitter, title },
};

const credibility = [
  { heading: "18+ years", copy: "Content, copy, conversion and digital strategy" },
  { heading: "100+ companies & brands", copy: "Across SaaS, technology, agencies and growth businesses" },
  { heading: "Strategy + execution", copy: "From positioning and campaigns to content systems and AI-enabled workflows" },
];

const approaches = [
  {
    heading: "Make the message land.",
    copy: "Clarify the positioning, messaging and conversion journey so people understand the value and know what to do next.",
  },
  {
    heading: "Make the content work harder.",
    copy: "Bring strategy, search, campaigns and commercial priorities together instead of treating them as separate content problems.",
  },
  {
    heading: "Fix the machinery underneath.",
    copy: "Improve the research, knowledge, workflows, AI use and quality control behind the content operation.",
  },
];

const offers = [
  {
    slug: "content-messaging-conversion",
    heading: "Content, Messaging & Conversion Strategy",
    copy: "For launches, websites, campaigns and propositions that need sharper strategic thinking before they need more output.",
  },
  {
    slug: "fractional-content-ai-strategy",
    heading: "Fractional Content & AI Strategy",
    copy: "Ongoing senior direction for teams with plenty happening and not enough strategic ownership.",
  },
  {
    slug: "ai-enabled-content-systems",
    heading: "AI-Enabled Content Systems",
    copy: "Audit and redesign the workflows, knowledge and quality controls behind content so AI improves the work instead of multiplying the mess.",
  },
];

const projects = [
  {
    name: "UTTR",
    category: "B2B SaaS & technology",
    copy: "Senior B2B copy across direct-response ads, landing pages, nurture emails and social content for 12+ startups, including Ramp, Durable, Gamma and Finch.",
  },
  {
    name: "Dreamscape Tents",
    category: "Strategy, website & growth",
    copy: "Led content strategy and digital marketing, designed and built the website, strengthened the company’s digital presence and helped secure contracts with Vinpearl Resort & Golf and TUI Blue.",
  },
  {
    name: "Compassionate Inquiry",
    category: "Copy, campaigns & conversion",
    copy: "Campaign and lifecycle email, landing-page and marketing copy translating complex trauma-informed ideas into clear, human communication without flattening the nuance.",
  },
];

export default function HomePage() {
  return (
    <div className={styles.home}>
      <Section aria-labelledby="page-title">
        <div className="page-stack hero">
          <p className="hero-eyebrow">Senior Content &amp; AI Strategist</p>
          <h1 id="page-title" className="hero-title">
            <span>Make complex things clear.</span>{" "}
            <span>Make clear things convert.</span>
          </h1>
          <p className="hero-summary">
            I help SaaS, technology and growth-focused teams sharpen the message, improve content performance and build smarter AI-enabled systems behind the work.
          </p>
          <div className="actions">
            <ActionLink href="/work-with-me/">Work with me</ActionLink>
            <ActionLink href="/work/" variant="secondary">View selected work</ActionLink>
          </div>
        </div>
      </Section>

      <div className={styles.credibility}>
        <Container>
          <dl className={styles.proofList}>
            {credibility.map(({ heading, copy }) => (
              <div key={heading}>
                <dt>{heading}</dt>
                <dd>{copy}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </div>

      <Section aria-labelledby="problem-title">
        <div className={styles.editorialSplit}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>The real problem</p>
            <h2 id="problem-title">Content problems rarely start with the content.</h2>
            <div className={styles.prose}>
              <p>Sometimes the message is fuzzy. Sometimes the journey leaks. Sometimes teams are producing plenty but nobody can explain what is working or why.</p>
              <p>And increasingly, the bottleneck is the system behind the work.</p>
            </div>
          </div>
          <ul className={styles.approaches}>
            {approaches.map(({ heading, copy }) => (
              <li key={heading}>
                <h3>{heading}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section aria-labelledby="offers-title">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Ways to work</p>
          <h2 id="offers-title">Different problems. Same objective.</h2>
          <p className={styles.intro}>Clearer thinking. Stronger content. Smarter systems.</p>
        </header>
        <div>
          {offers.map(({ slug, heading, copy }) => (
            <article key={slug} className={styles.offer} aria-labelledby={`${slug}-title`}>
              <h3 id={`${slug}-title`}>{heading}</h3>
              <p>{copy}</p>
              <ActionLink href={`/work-with-me/${slug}/`} variant="text" aria-label={`Explore ${heading}`}>Explore</ActionLink>
            </article>
          ))}
        </div>
      </Section>

      <Section aria-labelledby="work-title">
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Selected work</p>
          <h2 id="work-title">Proof, not promises.</h2>
        </header>
        <div className={styles.workList}>
          {projects.map(({ name, category, copy }, index) => (
            <article key={name} className={styles.project} aria-labelledby={`project-${index}-title`}>
              <header>
                <h3 id={`project-${index}-title`}>{name}</h3>
                <p className={styles.category}>{category}</p>
              </header>
              <p>{copy}</p>
              <ActionLink href="/work/" variant="text" aria-label={`View selected work: ${name}`}>View selected work</ActionLink>
            </article>
          ))}
        </div>
      </Section>

      <Section className={styles.aiSection} aria-labelledby="ai-title">
        <div className={styles.editorialSplit}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>AI, used properly</p>
            <h2 id="ai-title"><span>AI can make average work faster.</span>{" "}<span>That isn’t the goal.</span></h2>
          </div>
          <div className={styles.prose}>
            <p>AI is useful when it makes good judgement easier to apply, repeat and scale.</p>
            <p>I use it to sharpen research, improve knowledge and workflows, strengthen search visibility and raise consistency, with humans still responsible for the thinking that matters.</p>
            <p className={styles.emphasis}>More output is not the same as more impact.</p>
            <p className={styles.allmi}>Need broader operational AI or business automation? That sits under <a href="https://allmi.online">allmi</a>.</p>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="about-title">
        <div className={styles.editorialSplit}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>About Andy</p>
            <h2 id="about-title"><span>Built on marketing judgement.</span>{" "}<span>Not AI novelty.</span></h2>
          </div>
          <div className={styles.prose}>
            <p>I’ve spent 18+ years across advertising, copywriting, content, conversion and digital strategy.</p>
            <p>That matters because the interesting question isn’t “Where can we add AI?”</p>
            <p>It’s “What should the business be doing better, and where can AI help?”</p>
            <p>I still get hands-on with copy and content when that is the highest-value thing I can do. When the bigger problem is strategic or systemic, that is where the work goes.</p>
            <ActionLink href="/about/" variant="text">More about Andy</ActionLink>
          </div>
        </div>
      </Section>

      <Section className={styles.finalSection} aria-labelledby="contact-title">
        <div className={styles.editorialSplit}>
          <h2 id="contact-title">Got a content problem that feels harder than it should?</h2>
          <div className={styles.prose}>
            <p>Tell me what’s getting in the way. I’ll tell you whether I can help.</p>
            <ActionLink href="/contact/">Start a conversation</ActionLink>
          </div>
        </div>
      </Section>
    </div>
  );
}
