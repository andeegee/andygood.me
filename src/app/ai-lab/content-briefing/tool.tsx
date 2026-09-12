"use client";

import { useRef, useState, type FormEvent } from "react";
import { assignmentLabels, directionLabels, requirementLabels, searchLabels, toMarkdown, type Result } from "@/lib/content-briefing/schema";
import styles from "./tool.module.css";
import { SummaryView } from "./summary-view";
import { summaryMarkdown } from "./summary";
import { GenerationProgress } from "./generation-progress";

const tabs = ["Summary", "Full brief", "Evidence", "Gaps & decisions"] as const;
function Details({ values, labels }: { values: Record<string, string | string[]>; labels: Record<string, string> }) {
  return <dl className={styles.details}>{Object.entries(values).map(([key, value]) => <div key={key}><dt>{labels[key] ?? key}</dt><dd>{Array.isArray(value) ? value.length ? <ul>{value.map((item, i) => <li key={i}>{item}</li>)}</ul> : "None identified." : value || "Not supplied."}</dd></div>)}</dl>;
}

export function BriefingTool() {
  const [result, setResult] = useState<Result | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Summary");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const output = useRef<HTMLElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const abort = useRef<AbortController | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The ref locks synchronously, including submissions before React re-renders.
    if (abort.current) return;
    const data = new FormData(event.currentTarget);
    const assignment = Object.fromEntries(Object.keys(assignmentLabels).map((key) => [key, String(data.get(key) ?? "").trim()]));
    const sourceText = String(data.get("sourceText") ?? "").trim();
    const urls = String(data.get("urls") ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (!sourceText && !urls.length) { setError("Add pasted source text or at least one public URL."); return; }
    if (urls.length > 5) { setError("Use no more than five public URLs."); return; }
    if (urls.some((url) => { try { return !["http:", "https:"].includes(new URL(url).protocol); } catch { return true; } })) { setError("Enter a complete HTTP or HTTPS URL on each line."); return; }
    setBusy(true); setError(""); setNotice("");
    const controller = new AbortController();
    abort.current = controller;
    const timeout = setTimeout(() => controller.abort(), 165000);
    try {
      const response = await fetch("/api/content-briefing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...assignment, sourceText, urls }), signal: controller.signal });
      const payload = await response.json();
      controller.signal.throwIfAborted();
      if (!response.ok) throw new Error(payload.error || "The briefing could not be completed. Please retry.");
      setResult(payload); setDirty(false); setTab("Summary");
      setNotice("Draft ready. Review the evidence and unresolved decisions before use.");
      requestAnimationFrame(() => { output.current?.focus(); output.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); });
    } catch (e) {
      setError(e instanceof Error && e.name !== "AbortError" ? e.message : "The request was cancelled or timed out. Your inputs are still available.");
      requestAnimationFrame(() => errorMessage.current?.focus());
    }
    finally { clearTimeout(timeout); setBusy(false); abort.current = null; }
  }

  async function copy(summary = false) {
    if (!result) return;
    try { await navigator.clipboard.writeText(summary ? summaryMarkdown(result) : toMarkdown(result)); setNotice(summary ? "Summary copied. Full Markdown export remains available." : "Brief, evidence and decisions copied as Markdown."); }
    catch { setNotice("Clipboard access was unavailable. Download Markdown instead."); }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([toMarkdown(result)], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "content-brief.md"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Markdown export downloaded.");
  }

  return <div className={`container ${styles.workspace}`}>
    <header className={styles.intro}><p className={`${styles.eyebrow} section-eyebrow`}>Internal lab · v1</p><h1>Content briefing</h1><p className={styles.lead}>Turn an assignment and source material into an evidence-led working brief.</p><p className={styles.muted}>Drafts stay in this page and are cleared on refresh. Submitted material is sent to the configured AI provider for analysis.</p></header>
    <div className={styles.layout}>
      <form onSubmit={submit} onChange={() => { if (result) setDirty(true); }} className={styles.form}>
        <fieldset disabled={busy}><legend>01 / Assignment</legend><p className={styles.help}>All assignment fields are required unless marked optional.</p>
          {Object.entries(assignmentLabels).filter(([key]) => key !== "notes").map(([key, label]) => <label key={key} htmlFor={key}>{label}{key === "query" ? " (optional)" : ""}
            {key === "contentType" || key === "funnelStage" ? <select id={key} name={key} required defaultValue=""><option value="" disabled>Select {key === "contentType" ? "a content type" : "a funnel stage"}</option>{(key === "contentType" ? ["Article", "Landing page", "Case study", "White paper / guide", "Email", "Other"] : ["Awareness", "Consideration", "Decision", "Retention", "Across stages"]).map((v) => <option key={v}>{v}</option>)}</select> : <input id={key} name={key} required={key !== "query"} maxLength={key === "query" ? 1000 : 2000} />}
          </label>)}
        </fieldset>
        <fieldset disabled={busy}><legend>02 / Source material</legend><p className={styles.help}>Supply text, public URLs, or both. Source-supported claims still need editorial review.</p>
          <label htmlFor="sourceText">Pasted source text<textarea id="sourceText" name="sourceText" rows={9} maxLength={40000} aria-describedby="text-limit" /></label><p id="text-limit" className={styles.help}>Up to 40,000 characters. Label separate documents within your pasted text.</p>
          <label htmlFor="urls">Public URLs<textarea id="urls" name="urls" rows={4} maxLength={10244} aria-describedby="url-limit" placeholder="https://example.com/research" /></label><p id="url-limit" className={styles.help}>One per line, up to five. The first 20,000 characters of each usable page are analysed. For restricted pages or PDFs, paste the relevant text.</p>
          <label htmlFor="notes">Additional notes / constraints (optional)<textarea id="notes" name="notes" rows={4} maxLength={5000} /></label>
        </fieldset>
        {error && <p ref={errorMessage} tabIndex={-1} className={styles.warning} role="alert">{error}</p>}
        {busy ? <GenerationProgress onCancel={() => abort.current?.abort()} /> : <div className="actions"><button className="action action--primary" type="submit">{result ? "Generate a new draft" : "Generate draft brief"}</button></div>}
        <p className={styles.help}>Generation can take up to three minutes. Review source rights and confidentiality before submitting.</p>
      </form>
      <section className={styles.output} ref={output} tabIndex={-1} aria-label="Generated content brief" aria-busy={busy}>
        <div role="status" className={styles.notice}>{notice}</div>
        {!result ? <div className={styles.empty}><p className={`${styles.eyebrow} section-eyebrow`}>Your working brief</p><h2>Start with the assignment.<br />Build on the evidence.</h2><p>The output separates source-supported findings, reasonable inference and claims that need evidence.</p><ol><li><strong>Summary</strong><span>Selected priorities, proof and decisions.</span></li><li><strong>Full brief</strong><span>Strategic direction and content requirements.</span></li><li><strong>Evidence</strong><span>Findings, source references and quoted support.</span></li><li><strong>Gaps & decisions</strong><span>Missing proof and questions for human judgement.</span></li></ol></div> : <>
          <div className={styles.outputHeader}><span className={styles.status}>AI draft · Human review required</span><h2>{result.assignment.topic}</h2><p className={styles.muted}>Strategic recommendations require review. “Source-supported” means supported by supplied text, not independently verified.</p><div className="actions"><button type="button" className={styles.smallButton} onClick={() => copy(true)}>Copy summary</button><button type="button" className={styles.smallButton} onClick={() => copy()}>Copy Markdown</button><button type="button" className={styles.smallButton} onClick={download}>Download Markdown</button></div></div>
          {dirty && <p className={styles.warning}>The assignment has changed. This draft belongs to the previous submission. Generate a new draft to apply your changes.</p>}
          <div role="tablist" aria-label="Brief views" className={styles.tabs}>{tabs.map((name, i) => <button key={name} type="button" role="tab" id={`tab-${i}`} aria-controls={`panel-${i}`} aria-selected={tab === name} tabIndex={tab === name ? 0 : -1} onClick={() => setTab(name)} onKeyDown={(event) => { const next = event.key === "ArrowRight" ? (i + 1) % tabs.length : event.key === "ArrowLeft" ? (i + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1; if (next >= 0) { event.preventDefault(); setTab(tabs[next]); document.getElementById(`tab-${next}`)?.focus(); } }}>{name}{name === "Gaps & decisions" ? ` (${result.analysis.gaps.length + result.analysis.findings.filter((f) => f.classification === "Needs evidence").length})` : ""}</button>)}</div>
          {tabs.map((name, i) => <div key={name} role="tabpanel" id={`panel-${i}`} aria-labelledby={`tab-${i}`} hidden={tab !== name} tabIndex={0} className={styles.panel}>
            {name === "Summary" && <SummaryView result={result} />}
            {name === "Full brief" && <><section><h3>Assignment</h3><Details values={Object.fromEntries(Object.keys(assignmentLabels).map((key) => [key, result.assignment[key as keyof typeof assignmentLabels]]))} labels={assignmentLabels} /></section><section><h3>Strategic direction</h3><Details values={result.brief.direction} labels={directionLabels} /></section><section><h3>Content requirements</h3><Details values={{ ...result.brief.requirements, evidenceIds: result.brief.requirements.evidenceIds.map((id) => `${id}: ${result.analysis.findings.find((f) => f.id === id)?.finding ?? "Review evidence"}`) }} labels={requirementLabels} /></section>{result.brief.search && <section><h3>Search / discoverability</h3><Details values={result.brief.search} labels={searchLabels} /></section>}</>}
            {name === "Evidence" && <><h3>Source register</h3>{result.sources.map((source) => <div key={source.id} className={styles.source}><strong>{source.id} · {source.label}</strong>{source.url && /^https?:\/\//.test(source.url) && <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>}{source.warning && <p className={styles.warning}>{source.warning}</p>}</div>)}<h3>Findings</h3>{!result.analysis.findings.length && <p>No relevant findings identified. Review the gaps before proceeding.</p>}{result.analysis.findings.map((finding) => <article key={finding.id} className={finding.classification === "Needs evidence" ? styles.needs : finding.classification === "Inference" ? styles.inference : styles.finding}><p className={styles.classification}>{finding.id} · {finding.classification}</p><p>{finding.finding}</p>{finding.references.map((ref, index) => <blockquote key={index}><p>“{ref.quote}”</p><cite>{ref.sourceId} · {result.sources.find((s) => s.id === ref.sourceId)?.label}</cite></blockquote>)}{!finding.references.length && <p className={styles.help}>No verified source quotation.</p>}</article>)}</>}
            {name === "Gaps & decisions" && <><h3>Review before approval</h3>{result.analysis.findings.filter((f) => f.classification === "Needs evidence").map((f) => <article key={f.id} className={styles.needs}><p className={styles.classification}>{f.id} · Needs evidence</p><p>{f.finding}</p></article>)}{result.analysis.gaps.map((gap, index) => <article key={index} className={styles.needs}><p className={styles.classification}>{gap.kind}</p><p>{gap.detail}</p><p><strong>Next step:</strong> {gap.nextStep}</p></article>)}{!result.analysis.gaps.length && <p>No specific gaps were identified. Human review is still required.</p>}</>}
          </div>)}
        </>}
      </section>
    </div>
  </div>;
}
