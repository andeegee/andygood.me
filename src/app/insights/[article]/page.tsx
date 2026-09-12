import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionLink, Container } from "@/components/primitives";
import { breadcrumbSchema, personId, schemaGraph, StructuredData, websiteId } from "@/components/structured-data";
import { insightBySlug, insights } from "@/lib/insights";
import { isIndexable, site } from "@/lib/site";
import styles from "../insights.module.css";

export const dynamicParams = false;
export function generateStaticParams() { return insights.map(({ slug }) => ({ article: slug })); }
type Props = { params: Promise<{ article: string }> };
const displayDate = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = insightBySlug[(await params).article];
  if (!article) notFound();
  const title = article.slug === "ai-seo-geo-aeo-2026" ? "AI SEO vs GEO vs AEO: What Matters in 2026 | Andy Good" : article.slug === "b2b-saas-landing-page-not-converting" ? "B2B SaaS Landing Page Not Converting? Fix This First" : article.slug === "fractional-content-strategist" ? "Fractional Content Strategist: When Do You Need One?" : "AI Content Systems: Build a Better AI Content Workflow";
  return { title: { absolute: title }, description: article.description, alternates: { canonical: `/insights/${article.slug}/` }, robots: { index: isIndexable, follow: isIndexable }, openGraph: { type: "article", locale: site.locale, siteName: site.name, title, description: article.description, url: `/insights/${article.slug}/`, publishedTime: article.published, modifiedTime: article.updated ?? article.published, authors: ["Andy Good"] }, twitter: { card: "summary", title, description: article.description } };
}

export default async function ArticlePage({ params }: Props) {
  const article = insightBySlug[(await params).article];
  if (!article) notFound();
  const related = article.related.map((slug) => insightBySlug[slug]);
  const canonical = new URL(`/insights/${article.slug}/`, site.url).href;
  const jsonLd = schemaGraph(
    { "@type": "BlogPosting", "@id": `${canonical}#article`, url: canonical, headline: article.title, description: article.description, inLanguage: site.language, datePublished: article.published, dateModified: article.updated ?? article.published, mainEntityOfPage: canonical, isPartOf: { "@id": websiteId }, author: { "@id": personId }, publisher: { "@id": personId } },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Insights", path: "/insights/" },
      { name: article.title, path: `/insights/${article.slug}/` },
    ]),
  );
  return <Container className={styles.article}><article>
    <StructuredData data={jsonLd} />
    <header className={styles.articleHeader}><Link className={styles.articleLink} href="/insights/">Back to insights</Link><p className={styles.eyebrow}>{article.category}</p><h1>{article.title}</h1><p className={styles.standfirst}>{article.standfirst}</p><p className={styles.byline}>By <Link href="/about/">Andy Good</Link>, Senior Content &amp; AI Strategist<br /><time dateTime={article.published}>Published {displayDate(article.published)}</time>{article.updated ? <> · <time dateTime={article.updated}>Updated {displayDate(article.updated)}</time></> : null} · {article.readingTime}</p></header>
    <div className={styles.body}>{article.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.list ? <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul> : null}{section.table ? <div className={styles.tableWrap} role="region" aria-label={`${section.heading} table`} tabIndex={0}><table className={styles.table}><thead><tr>{section.table.headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{section.table.rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div> : null}</section>)}</div>
    <section className={styles.takeaways}><h2>Key takeaways</h2><ul>{article.takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}</ul></section>
    <section className={styles.cta}><div className={styles.ctaInner}><h2>{article.cta.heading}</h2><p>{article.cta.copy}</p><ActionLink href={article.cta.href}>{article.cta.label}</ActionLink></div></section>
    {article.furtherReading ? <section className={styles.related}><h2>Further reading</h2><ul>{article.furtherReading.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul></section> : null}
    {article.sources ? <section className={styles.sources}><h2>Sources</h2><ul>{article.sources.map((source) => <li key={source.href}><a href={source.href}>{source.label}</a></li>)}</ul></section> : null}
    <section className={styles.related}><h2>Related articles</h2><ul>{related.map((item) => <li key={item.slug}><Link href={`/insights/${item.slug}/`}>{item.title}</Link></li>)}</ul></section>
    <aside className={styles.author}>Written by <Link href="/about/">Andy Good</Link>, Senior Content &amp; AI Strategist.</aside>
  </article></Container>;
}
