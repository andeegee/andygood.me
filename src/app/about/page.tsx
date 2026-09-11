import Image from "next/image";
import { ActionLink, Container } from "@/components/primitives";
import { pageMetadata } from "@/lib/metadata";
import portrait from "../../../public/about/andy-good-profile.png";
import styles from "./about.module.css";

const title = "About Andy Good | Senior Content & AI Strategist";
const description = "Meet Andy Good, a Senior Content & AI Strategist with 18+ years across copywriting, content, conversion, digital strategy and AI-enabled content systems.";
const baseMetadata = pageMetadata("About", "/about/", description);
export const metadata = {
  ...baseMetadata,
  title: { absolute: title },
  openGraph: { ...baseMetadata.openGraph, title },
  twitter: { ...baseMetadata.twitter, title },
};

const principles = [
  ["Clarity before output", "More content is not automatically better content. If the proposition is unclear, scaling production usually scales the problem."],
  ["Strategy before tactics", "Fix the thinking first. Then decide whether the answer is copy, content, search, a campaign, a workflow or something else."],
  ["AI where it earns its place", "AI is useful when it improves research, knowledge, consistency, speed or decision-making. It is not useful simply because it is available."],
  ["Hands-on when it matters", "I still write. I still get into the page, campaign or message when that is the highest-value thing I can do."],
];

export default function AboutPage() {
  return (
    <div className={styles.about}>
      <section className={styles.hero} aria-labelledby="about-title">
        <Container className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>About Andy</p>
            <h1 id="about-title"><span>The tools changed.</span><span>The job didn’t.</span></h1>
            <p className={styles.intro}>I’m Andy Good, a Senior Content &amp; AI Strategist with 18+ years across advertising, copywriting, content, conversion and digital strategy.</p>
            <p>The work has evolved. The commercial problem hasn’t: make the message clearer, make the content more useful and make it easier for people to act.</p>
          </div>
          <div className={styles.portrait}>
            <Image src={portrait} alt="Andy Good" preload sizes="(max-width: 767px) 100vw, 48vw" />
          </div>
        </Container>
      </section>
      <section className={styles.section} aria-labelledby="background-title">
        <Container className={styles.editorial}>
          <h2 id="background-title">I didn’t arrive at AI from the technology side.</h2>
          <div className={styles.prose}>
            <p>I started in media, advertising and commercial roles, then moved deeper into digital marketing, copywriting, content and conversion.</p>
            <p>Over time, the work became less about producing individual assets and more about solving the problem behind them.</p>
            <div className={styles.questions}>
              <p>Why isn’t the proposition landing?</p>
              <p>Why is the website getting traffic but not converting?</p>
              <p>Why is the team producing more content without getting better results?</p>
              <p>Why is AI making the process faster but the output more average?</p>
            </div>
            <p>That progression is what led me into content strategy, messaging, conversion, content operations and AI-enabled systems.</p>
            <div className={styles.positioning}>
              <p>I’m not an AI practitioner who learned marketing.</p>
              <p>I’m a marketing, content and conversion strategist learning how to redesign that work for the AI era.</p>
            </div>
          </div>
        </Container>
      </section>
      <section className={`${styles.section} ${styles.dark}`} aria-labelledby="experience-title">
        <Container className={styles.editorial}>
          <h2 id="experience-title">After enough years, you stop treating symptoms.</h2>
          <div className={styles.prose}>
            <div className={styles.pair}>
              <p>A landing page that isn’t converting may not have a copy problem.</p>
              <p>It may have a positioning problem.</p>
            </div>
            <div className={styles.pair}>
              <p>Poor organic performance may not start with SEO.</p>
              <p>It may start with weak strategy, unclear intent or content that is answering the wrong question.</p>
            </div>
            <div className={styles.pair}>
              <p>And bad AI output often has very little to do with the model.</p>
              <p>The real problem may be the research, source knowledge, briefing, workflow or review process behind it.</p>
            </div>
            <div className={styles.insight}>
              <p>That is the value of experience.</p>
              <p>You get better at finding the problem underneath the problem.</p>
            </div>
          </div>
        </Container>
      </section>
      <section className={styles.section} aria-labelledby="principles-title">
        <Container>
          <h2 id="principles-title" className={styles.principlesTitle}>Commercial problem first. Tools second.</h2>
          <div className={styles.principles}>
            {principles.map(([heading, copy]) => (
              <div key={heading} className={styles.principle}><h3>{heading}</h3><p>{copy}</p></div>
            ))}
          </div>
          <p className={styles.execution}>Strategy does not become more valuable by becoming detached from execution.</p>
        </Container>
      </section>
      <div className={styles.proof}>
        <Container>
          <dl>
            <div><dt>18+ years</dt><dd>Advertising, content, copy, conversion and digital strategy</dd></div>
            <div><dt>100+ companies &amp; brands</dt><dd>Across SaaS, technology, agencies and growth businesses</dd></div>
            <div><dt>Strategy + execution</dt><dd>From messaging and campaigns to AI-enabled content systems</dd></div>
          </dl>
        </Container>
      </div>
      <section className={styles.section} aria-labelledby="allmi-title">
        <Container className={styles.editorial}>
          <h2 id="allmi-title">Two brands. Different problems.</h2>
          <div className={styles.prose}>
            <p>My work as Andy Good stays focused on content, marketing, messaging, conversion and the systems behind them.</p>
            <p>For broader operational AI, automation and business systems, I work through allmi.</p>
            <a className={styles.allmiLink} href="https://allmi.online">Visit allmi</a>
          </div>
        </Container>
      </section>
      <section className={`${styles.section} ${styles.dark} ${styles.final}`} aria-labelledby="contact-title">
        <Container>
          <h2 id="contact-title">If the problem sits somewhere between content, strategy and AI, we should probably talk.</h2>
          <ActionLink href="/contact/">Start a conversation</ActionLink>
        </Container>
      </section>
    </div>
  );
}
