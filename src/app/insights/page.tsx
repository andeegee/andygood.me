import Link from "next/link";
import { ActionLink, Container } from "@/components/primitives";
import { insights } from "@/lib/insights";
import { pageMetadata } from "@/lib/metadata";
import styles from "./insights.module.css";

export const metadata = pageMetadata("Insights | Content, AI & Marketing Strategy", "/insights/", "Practical thinking from Senior Content & AI Strategist Andy Good on content strategy, conversion, AI search, GEO, SaaS marketing and AI-enabled content systems.");
export default function InsightsPage() {
  const [featured, ...rest] = insights;
  return <>
    <section className={styles.hero}><Container><span className={styles.eyebrow}>Insights</span><h1>Clearer thinking on content, conversion and AI.</h1><p>Practical ideas about making content perform, adapting marketing for AI and building better systems behind the work.</p></Container></section>
    <Container className={styles.index}>
      <article className={styles.feature}><span className={styles.eyebrow}>{featured.category}</span><h2>{featured.title}</h2><p>{featured.standfirst}</p><ActionLink className={styles.articleLink} href={`/insights/${featured.slug}/`} variant="text">Read the article</ActionLink></article>
      <div className={styles.list}>{rest.map((article) => <article className={styles.entry} key={article.slug}><div><span className={styles.eyebrow}>{article.category}</span><p className={styles.meta}>{article.readingTime}</p></div><div><h2><Link href={`/insights/${article.slug}/`}>{article.title}</Link></h2><p>{article.description}</p><Link className={styles.articleLink} href={`/insights/${article.slug}/`}>Read the article</Link></div></article>)}</div>
      <section className={styles.cta}><div className={styles.ctaInner}><h2>Need to apply the thinking, not just read about it?</h2><p>I work with SaaS, technology and growth-focused teams on messaging, content strategy, conversion, AI search and the systems behind the work.</p><ActionLink href="/work-with-me/">Ways to work</ActionLink></div></section>
    </Container>
  </>;
}
