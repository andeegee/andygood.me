import type { Result } from "@/lib/content-briefing/schema";
import { selectSummary } from "./summary";
import styles from "./tool.module.css";

function CompactText({ text }: { text: string }) {
  if (text.length <= 240) return <p>{text}</p>;
  const end = text.lastIndexOf(" ", 220);
  return <details className={styles.excerpt}><summary>{text.slice(0, end > 120 ? end : 220)}… <span>Read full text</span></summary><p>{text}</p></details>;
}

function SummaryFields({ values }: { values: Record<string, string> }) {
  return <dl className={styles.summaryFields}>{Object.entries(values).map(([label, text]) => <div key={label}><dt>{label}</dt><dd><CompactText text={text} /></dd></div>)}</dl>;
}

export function SummaryView({ result }: { result: Result }) {
  const summary = selectSummary(result);
  return <div className={styles.summary}>
    <p className={styles.help}>Selected priorities from the full brief. Open Full brief for all recommendations, or expand longer passages here.</p>
    <section aria-label="Assignment summary"><h3>Assignment</h3><SummaryFields values={summary.assignment} /></section>
    <section aria-label="Strategic direction summary"><h3>Strategic direction</h3><SummaryFields values={summary.direction} /></section>
    <section aria-label="Content priorities"><h3>Content priorities</h3><ul className={styles.summaryList}>{summary.priorities.map((p, i) => <li key={i}><span className={styles.summaryLabel}>{p.label}</span><CompactText text={p.text} /></li>)}</ul>{!summary.priorities.length && <p>No priorities identified. Review the full brief.</p>}</section>
    <section aria-label="Evidence to use"><h3>Evidence to use <span className={styles.evidenceStatus}>Source-supported</span></h3><ul className={styles.summaryList}>{summary.evidence.map((f) => <li key={f.id}><span className={styles.summaryLabel}>{f.id} · {[...new Set(f.references.map((r) => r.sourceId))].join(", ")}</span><CompactText text={f.finding} /></li>)}</ul>{!summary.evidence.length && <p>No source-supported proof identified. More evidence is needed.</p>}</section>
    <section aria-label="Biggest gaps" className={styles.summaryGaps}><h3>Biggest gaps</h3><ul className={styles.summaryList}>{summary.gaps.map((g, i) => <li key={i}><span className={styles.summaryLabel}>{g.kind}</span><CompactText text={g.detail} /><details className={styles.nextStep}><summary>Next step</summary><p>{g.nextStep}</p></details></li>)}</ul>{!summary.gaps.length && <p>No specific gaps identified. Human review is still required.</p>}</section>
    <section aria-label="Recommended structure"><h3>Recommended structure</h3><ol className={styles.summaryOutline}>{summary.outline.map((text, i) => <li key={i}><CompactText text={text} /></li>)}</ol>{!summary.outline.length && <p>No structure identified. Review the full brief.</p>}{result.brief.requirements.outline.length > 8 && <p className={styles.help}>Showing opening sections and the final section. The complete outline is in Full brief.</p>}</section>
    {summary.search && <section aria-label="Search / GEO summary"><h3>Search / GEO</h3><SummaryFields values={summary.search} /></section>}
  </div>;
}
