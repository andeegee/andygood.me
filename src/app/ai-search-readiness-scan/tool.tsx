"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { limitation, privacyCopy, strategyCopy, type FactorId } from "@/lib/ai-search-readiness/config";
import type { DeliveryStatus, GateInput, Report, ScanResponse } from "@/lib/ai-search-readiness/schema";
import base from "../website-friction-scan/scan.module.css";
import styles from "./scan.module.css";

async function readResponse(response: Response) {
  try { return await response.json(); }
  catch { throw new Error("The scan service returned an unreadable response. Please try again."); }
}
function Priorities({ ids, report }: { ids: FactorId[]; report: Report }) {
  return ids.length ? <ol className={styles.list}>{ids.map((id) => { const f = report.factors.find((f) => f.id === id)!; return <li key={id}><h3>{f.label}</h3><p>{f.action}</p></li>; })}</ol> : <p>No additional changes were confidently prioritised from the extracted content.</p>;
}
export default function ScanTool() {
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [gateError, setGateError] = useState("");
  const [delivery, setDelivery] = useState<DeliveryStatus | "unknown" | null>(null);
  const [recipient, setRecipient] = useState<GateInput | null>(null);
  const active = useRef<AbortController | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const fullHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => { if (report) fullHeading.current?.focus(); else if (result) resultHeading.current?.focus(); }, [result, report]);
  useEffect(() => {
    if (delivery !== "pending" || !recipient) return;
    const controller = new AbortController();
    let attempts = 0, timer: ReturnType<typeof setTimeout>;
    async function check() {
      try {
        const response = await fetch("/api/ai-search-readiness-scan/report/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...recipient, action: "status" }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        const data = await readResponse(response);
        if (!response.ok) throw new Error();
        if (data.status === "sent" || data.status === "failed") { setDelivery(data.status); return; }
        if (++attempts >= 19) { setDelivery("unknown"); return; }
        timer = setTimeout(check, 5000);
      } catch { if (!controller.signal.aborted) setDelivery("unknown"); }
    }
    timer = setTimeout(check, 5000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [delivery, recipient]);

  async function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active.current) return;
    const fields = new FormData(event.currentTarget), controller = new AbortController();
    active.current = controller;
    setBusy(true); setError(""); setGateError(""); setResult(null); setReport(null); setRecipient(null); setDelivery(null);
    try {
      const response = await fetch("/api/ai-search-readiness-scan/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: fields.get("url"), topic: fields.get("topic") || "" }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(85000)]) });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.error || "The scan could not be completed. Please try again.");
      setResult(data);
    } catch (e) { setError(controller.signal.aborted ? "Scan cancelled. You can start again." : e instanceof Error && e.name !== "TimeoutError" ? e.message : "The scan timed out. Please try again."); }
    finally { active.current = null; setBusy(false); }
  }
  async function unlock(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!result || active.current) return;
    const fields = event ? new FormData(event.currentTarget) : null;
    const submission: GateInput = recipient || { token: result.token, email: String(fields?.get("email") || ""), company: String(fields?.get("company") || ""), action: "unlock" };
    const controller = new AbortController(); active.current = controller;
    setSending(true); setGateError("");
    try {
      const response = await fetch("/api/ai-search-readiness-scan/report/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...submission, action: report ? "retry" : "unlock" }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.error || "The report could not be unlocked. Please retry.");
      setReport(data.report); setRecipient(submission); setDelivery(data.status);
    } catch (e) { setGateError(e instanceof Error && e.name !== "TimeoutError" ? e.message : "The report request timed out. Retry with the same email address."); }
    finally { active.current = null; setSending(false); }
  }
  return <div className={base.tool}>
    <form onSubmit={scan} className={base.form} aria-label="AI Search Readiness Scan">
      <fieldset disabled={busy || sending}>
        <div className={base.field}><label htmlFor="readiness-url">Page URL</label><input id="readiness-url" name="url" type="url" required maxLength={2048} autoComplete="url" placeholder="https://example.com/page" aria-describedby="readiness-public" /><p id="readiness-public" className={base.note}>Public webpages only. No private or logged-in pages.</p></div>
        <div className={base.field}><label htmlFor="readiness-topic">Target topic or question <span className={base.optional}>(optional)</span></label><input id="readiness-topic" name="topic" maxLength={500} aria-describedby="readiness-topic-help" /><p id="readiness-topic-help" className={base.note}>What would you ideally like this page to be understood or discovered for?</p></div>
        <button type="submit" className="action action--primary">{busy ? "Scanning your page..." : "Run the scan"}</button>
      </fieldset>
    </form>
    {busy && <div className={base.progress}><p role="status">Reading the page and evaluating its readiness signals. This usually takes less than a minute.</p><button type="button" className="action action--text" onClick={() => active.current?.abort()}>Cancel scan</button></div>}
    {error && <p className={base.notice} role="alert">{error}</p>}
    {result && <article className={base.result} aria-labelledby="readiness-result">
      <header className={base.resultHeader}>
        <h2 id="readiness-result" ref={resultHeading} tabIndex={-1}>AI Search Readiness</h2>
        <p className={styles.score}>{result.preview.score} <span>/ 100</span></p>
        <h3>{result.preview.band}</h3><p>{result.preview.bandCopy}</p>
        <p className={base.url}>{result.preview.url}</p>
      </header>
      <section aria-labelledby="readiness-breakdown"><h2 id="readiness-breakdown">Seven readiness factors</h2>
        <ul className={styles.breakdown}>{result.preview.factors.map((f) => <li key={f.id} className={`${styles.factor} ${f.id === result.preview.weakest ? styles.weakest : ""}`}><div><span>{f.label}{f.id === result.preview.weakest && <span className={base.note}> · Biggest opportunity</span>}</span><strong>{f.score} / {f.maximum}</strong></div><div className={styles.track} aria-hidden="true"><span style={{ width: `${f.score / f.maximum * 100}%` }} /></div></li>)}</ul>
      </section>
      <section className={styles.opportunity}><h2>Biggest opportunity: {result.preview.opportunity.label}</h2><p>{result.preview.opportunity.found}</p><p><strong>First move: </strong>{result.preview.opportunity.action}</p><p className={base.note}>{result.preview.opportunity.uncertainty}</p></section>
      {result.preview.warnings.map((warning) => <p className={base.note} key={warning}>{warning}</p>)}
      {!report && <section className={base.emailGate}>
        <h2>Get your full AI Search Readiness report</h2><p>See all seven readiness factors, your top three priorities and page-specific recommendations.</p>
        <form onSubmit={unlock} aria-label="Unlock the full report"><fieldset disabled={sending} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "grid", gap: "1rem" }}>
          <div className={base.field}><label htmlFor="readiness-email">Work email</label><input id="readiness-email" name="email" type="email" required maxLength={254} autoComplete="email" aria-describedby="readiness-privacy" /></div>
          <div className={base.field}><label htmlFor="readiness-company">Company or website <span className={base.optional}>(optional)</span></label><input id="readiness-company" name="company" maxLength={300} autoComplete="organization" /></div>
          <p id="readiness-privacy" className={base.note}>{privacyCopy}</p>
          <button type="submit" className="action action--primary">{sending ? "Unlocking your report..." : "Show me the full report"}</button>
        </fieldset></form>
      </section>}
      {gateError && <p role="alert" className={base.notice}>{gateError}</p>}
      {report && <>
        <section><h2 tabIndex={-1} ref={fullHeading}>Your full AI Search Readiness report</h2><p>{report.score}/100 · {report.band}</p><p className={base.note}>Each finding is grounded in this page&apos;s extracted content or measured HTML. Quotations establish provenance, not independent verification.</p>
          {report.factors.map((f) => <div className={styles.detail} key={f.id}><h3>{f.label}: {f.score}/{f.maximum}</h3><p><strong>What was found: </strong>{f.found}</p><p><strong>Why it matters: </strong>{f.why}</p><p><strong>Recommended action: </strong>{f.action}</p><blockquote><span>{f.id === "technical" ? "Measured HTML and response signals" : "From the page"}</span>{f.quote}</blockquote><p className={base.note}>{f.uncertainty}</p></div>)}
        </section>
        <section><h2>Top three priorities</h2><Priorities ids={report.priorities} report={report} /></section>
        <section><h2>Quick wins</h2><Priorities ids={report.quickWins} report={report} /></section>
        <section><h2>Strategic opportunities</h2><Priorities ids={report.strategic} report={report} /></section>
        <section><h2>Important limitation</h2><p>{limitation}</p></section>
        <section><h2>Want me to look at the content behind the score?</h2><p>{strategyCopy}</p><Link href="/contact/" className="action action--text">Talk through my AI search strategy</Link></section>
        <div className={styles.delivery}>
          {delivery === "pending" && <p role="status">Your full report is unlocked. Sending the report and private notification now.</p>}
          {delivery === "sent" && <p role="status">Your report and the private notification have been sent. Check your inbox and spam folder.</p>}
          {(delivery === "failed" || delivery === "unknown") && <><p role="alert">{delivery === "failed" ? "We could not finish sending the report and private notification." : "We could not confirm email delivery."} Your full report remains unlocked. Retry with the same email address.</p><button type="button" className="action action--secondary" disabled={sending} onClick={() => unlock()}>{sending ? "Retrying..." : "Retry email delivery"}</button></>}
        </div>
      </>}
    </article>}
  </div>;
}
