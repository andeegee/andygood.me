import Image, { type StaticImageData } from "next/image";
import { ActionLink, Section } from "@/components/primitives";
import { pageMetadata } from "@/lib/metadata";
import glasshouse from "../../../public/work/work-glasshouse-feature.png";
import datasaur from "../../../public/work/work-datasaur-feature.png";
import ramp from "../../../public/work/work-ramp-feature.png";
import moxie from "../../../public/work/work-moxie-support.png";
import datch from "../../../public/work/work-datch-support.png";
import { projects, moreProjects } from "./projects";
import styles from "./work.module.css";

export const metadata = pageMetadata("Work", "/work/", "Selected strategy, copy, conversion, SaaS, technology and AI work by Senior Content & AI Strategist Andy Good.");

function Artwork({ source, name, alt, sizes }: { source: StaticImageData; name: string; alt: string; sizes: string }) {
  return <figure className={styles.artwork}><a href={`/work/work-${name}.png`} aria-label={`View full-size artwork: ${alt}`}><Image src={source} alt={alt} sizes={sizes} /><span className={styles.imageLink}>View full-size artwork <span aria-hidden="true">↗</span></span></a></figure>;
}

const artwork = [
  { source: glasshouse, name: "glasshouse-feature", alt: "Glasshouse broker landing page showing the referral proposition, seller proof and appraisal process" },
  { source: datasaur, name: "datasaur-feature", alt: "Three Datasaur paid social examples about AI model evaluation, custom LLMs and model selection" },
  { source: ramp, name: "ramp-feature", alt: "Ramp Partner Program campaign variations using proof, partner incentives and operational benefits" },
];

export default function WorkPage() {
  return <div className={styles.work}>
    <Section className={styles.hero} aria-labelledby="work-heading"><p className={`${styles.eyebrow} section-eyebrow`}>Selected work</p><h1 id="work-heading"><span>Work that made the message clearer.</span> <span>The content work harder.</span> <span>Or the system smarter.</span></h1><p className={styles.summary}>A selection of strategy, copy, campaigns and content work across SaaS, technology, AI and growth.</p></Section>
    <Section className={styles.featureIntro} aria-labelledby="featured-heading"><div><p className={`${styles.eyebrow} section-eyebrow`}>Featured projects</p><h2 id="featured-heading">Proof, not a portfolio dump.</h2></div><p>The format changes. The job usually doesn’t: understand the commercial problem, make the proposition easier to grasp, and create work that gives people a reason to act.</p></Section>
    {projects.map((project, index) => <Section key={project.name} className={[styles.fog, styles.dark, styles.light, styles.fog][index]} aria-labelledby={`project-${index}`}>
      <div className={[styles.leadGrid, `${styles.featureGrid} ${styles.reverse}`, styles.rampGrid, styles.dreamscapeGrid][index]}>
        <div className={styles.copy}><header><p className={styles.client}>{project.url ? <a href={project.url}>{project.name}</a> : project.name}</p><p className={styles.category}>{project.category}</p></header><h3 id={`project-${index}`}>{project.heading}</h3><div className={styles.prose}>{project.copy.map(copy => <p key={copy}>{copy}</p>)}</div><div className={styles.deliverables}><p>Selected work</p><ul>{project.items.map(item => <li key={item}>{item}</li>)}</ul></div></div>
        {index < 3 ? <Artwork {...artwork[index]} sizes={index === 2 ? "(max-width: 767px) 92vw, 848px" : "(max-width: 767px) 92vw, (max-width: 1304px) 52vw, 672px"} /> : <dl className={styles.proof}><div><dt>Role</dt><dd>Fractional content &amp; marketing</dd></div><div><dt>Scope</dt><dd>Strategy · Website · SEO · Campaigns</dd></div><div><dt>Commercial proof</dt><dd>Contracts including Vinpearl Resort &amp; Golf and TUI Blue</dd></div></dl>}
      </div>
    </Section>)}
    <Section aria-labelledby="more-heading"><div className={styles.moreIntro}><p className={`${styles.eyebrow} section-eyebrow`}>More selected work</p><h2 id="more-heading">Different sectors. Same need for clarity.</h2></div>
      {moreProjects.map((project, index) => <article key={project.name} className={index < 2 ? styles.support : styles.textProject} aria-labelledby={`more-${index}`}><div className={styles.copy}><header><h3 id={`more-${index}`}><a href={project.url}>{project.name}</a></h3><p className={styles.category}>{project.category}</p></header>{index < 2 && <p>{project.copy}</p>}</div>{index === 0 ? <div className={styles.moxieArt}><Artwork source={moxie} name="moxie-support" alt="Moxie landing-page copy concept for medspa founders, including headline, proposition and callouts" sizes="(max-width: 767px) 92vw, 440px" /></div> : index === 1 ? <div className={styles.datchArt}><Artwork source={datch} name="datch-support" alt="Supplied Datch LinkedIn campaign artwork promoting AI Asset Insights" sizes="263px" /></div> : <p>{project.copy}</p>}</article>)}
    </Section>
    <Section className={styles.final} aria-labelledby="contact-heading"><div className={styles.closingGrid}><h2 id="contact-heading">Got a complicated proposition of your own?</h2><div className={styles.copy}><p>Tell me where the friction is. I’ll tell you whether I can help.</p><ActionLink href="/contact/">Start a conversation</ActionLink></div></div></Section>
  </div>;
}
