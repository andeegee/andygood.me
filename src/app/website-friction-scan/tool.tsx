"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { closingNote, type Observation, type ScanResponse } from "@/lib/friction-scan/schema";
import styles from "./scan.module.css";

const messages = ["Reading the page", "Understanding the proposition", "Checking clarity and proof", "Reviewing the conversion journey", "Looking at search and AI visibility", "Prioritising the biggest friction"];
function Evidence({ item }: { item: Observation }) {
  return <><p>{item.explanation}</p><blockquote><span>From the page</span>“{item.quote}”</blockquote></>;
}
export default function ScanTool() {
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [sent, setSent] = useState("");
  const active = useRef<AbortController | null>(null);
  const emailActive = useRef(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const started = useRef(0);
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  useEffect(() => { if (result) resultHeading.current?.focus(); }, [result]);
  async function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active.current || emailActive.current) return;
    const fields = new FormData(event.currentTarget);
    const controller = new AbortController();
    active.current = controller;
    started.current = Date.now();
    setElapsed(0); setBusy(true); setError(""); setResult(null); setSent(""); setEmailError("");
    try {
      const response = await fetch("/api/website-friction-scan/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: fields.get("url"), goal: fields.get("goal"), audience: fields.get("audience") }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(85000)]) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The scan could not be completed. Please try again.");
      setResult(data);
    } catch (e) { setError(controller.signal.aborted ? "Scan cancelled. You can start again when you’re ready." : e instanceof Error ? e.message : "The scan could not be completed. Please try again."); }
    finally { active.current = null; setBusy(false); }
  }
  async function sendReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result || emailActive.current || sent) return;
    emailActive.current = true;
    setSending(true); setEmailError("");
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/website-friction-scan/report/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fields.get("email"), token: result.token }), signal: AbortSignal.timeout(65000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not send the report. Please retry.");
      setSent(data.message);
    } catch (e) { setEmailError(e instanceof Error ? e.message : "We could not send the report. Please retry."); }
    finally { emailActive.current = false; setSending(false); }
  }
  return <div className={styles.tool}>
    <form onSubmit={scan} className={styles.form} aria-label="Website Friction Scan">
      <fieldset disabled={busy || sending}>
        <div className={styles.field}><label htmlFor="scan-url">Page URL</label><input id="scan-url" name="url" type="url" required maxLength={2048} placeholder="https://example.com/page" autoComplete="url" aria-describedby="public-pages" /><p id="public-pages" className={styles.note}>Public webpages only. No private or logged-in pages.</p></div>
        <div className={styles.field}><label htmlFor="scan-goal">What should this page make people do?</label><textarea id="scan-goal" name="goal" required minLength={3} maxLength={500} rows={2} placeholder="Book a demo, contact us, buy, sign up, understand the offer..." /></div>
        <div className={styles.field}><label htmlFor="scan-audience">Who is the page for? <span className={styles.optional}>(optional)</span></label><input id="scan-audience" name="audience" maxLength={300} placeholder="e.g. SaaS founders, HR leaders, homeowners" /></div>
        <button className="action action--primary" type="submit">{busy ? "Scanning your page…" : "Scan my page"}</button>
      </fieldset>
    </form>
    {busy && <div className={styles.progress}>
      <p role="status">{messages[Math.min(Math.floor(elapsed / 8), messages.length - 1)]}</p>
      <p className={styles.note}><span aria-label={`${elapsed} seconds elapsed`}>{elapsed}s elapsed</span> · This usually takes less than a minute.</p>
      <button type="button" className="action action--text" onClick={() => active.current?.abort()}>Cancel scan</button>
    </div>}
    {error && <p role="alert" className={styles.notice}>{error}</p>}
    {result && <article className={styles.result} aria-labelledby="scan-result-title">
      <header className={styles.resultHeader}>
        <p className={styles.status}>{result.preview.status}</p>
        <h2 id="scan-result-title" tabIndex={-1} ref={resultHeading}>Your Website Friction Scan</h2>
        <p className={styles.url}>{result.url}</p>
        {result.warnings.map((warning) => <p className={styles.note} key={warning}>{warning}</p>)}
      </header>
      <section><h2>What’s working</h2>{result.preview.strengths.map((item, i) => <div className={styles.observation} key={i}><Evidence item={item} /></div>)}</section>
      <section><h2>3 biggest friction points</h2><ol className={styles.friction}>{result.preview.frictionPoints.map((item, i) => <li key={i}><h3>{item.heading}</h3><p>{item.explanation}</p><p><strong>Why it matters: </strong>{item.whyItMatters}</p><blockquote><span>From the page</span>“{item.quote}”</blockquote></li>)}</ol></section>
      <section className={styles.priority}><h2>What I’d fix first</h2><Evidence item={result.preview.fixFirst} /></section>
      <p className={styles.note}>{closingNote}</p>
      <section className={styles.emailGate}><h2>Want the full scan?</h2><p>Get the complete breakdown, including priority fixes, missed opportunities and practical recommendations.</p>
        <form onSubmit={sendReport} aria-label="Email the full scan">
          <div className={styles.field}><label htmlFor="scan-email">Email</label><input type="email" id="scan-email" name="email" required maxLength={254} autoComplete="email" disabled={sending || !!sent} aria-describedby="scan-privacy" /></div>
          <p id="scan-privacy" className={styles.note}>We’ll use your email to send this report and related follow-up about the scan. No spam.</p>
          <button type="submit" className="action action--primary" disabled={sending || !!sent}>{sending ? "Sending your report…" : sent ? "Report sent" : "Send me the full scan"}</button>
          {emailError && <p role="alert" className={styles.notice}>{emailError}</p>}
          {sent && <p role="status">{sent}</p>}
        </form>
      </section>
    </article>}
  </div>;
}
