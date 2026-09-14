"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  answerScores,
  calculateResult,
  contextOptions,
  dimensionInterpretations,
  dimensionLabels,
  dimensions,
  questions,
  scoreBand,
  stages,
  type Answers,
  type DiagnosticResult,
} from "@/lib/content-workflow-diagnostic/config";
import styles from "./diagnostic.module.css";

type Context = { role: string; teamSize: string; monthlyOutput: string };
const emptyContext: Context = { role: "", teamSize: "", monthlyOutput: "" };

function ChoiceGroup({ name, legend, choices, value, onChange }: { name: string; legend: string; choices: readonly string[]; value: string; onChange: (value: string) => void }) {
  return <fieldset className={styles.question} data-question><legend>{legend}</legend><div className={styles.choices}>{choices.map((choice) => <label className={styles.choice} key={choice}><input type="radio" name={name} value={choice} checked={value === choice} onChange={() => onChange(choice)} required /><span>{choice}</span></label>)}</div></fieldset>;
}

function ScoredQuestion({ question, value, onChange }: { question: (typeof questions)[number]; value?: number; onChange: (score: number) => void }) {
  return <fieldset className={styles.question} data-question><legend><span className={styles.questionNumber}>Question {question.number}</span>{question.prompt}</legend><div className={styles.choices}>{question.choices.map((choice, index) => <label className={styles.choice} key={choice}><input type="radio" name={question.id} value={answerScores[index]} checked={value === answerScores[index]} onChange={() => onChange(answerScores[index])} required /><span>{choice}</span></label>)}</div></fieldset>;
}

function ScoreList({ result }: { result: DiagnosticResult }) {
  return <dl className={styles.scoreList}>{dimensions.map((dimension) => <div className={dimension === result.primaryBottleneck ? styles.weakest : ""} key={dimension}><dt>{dimensionLabels[dimension]}</dt><dd>{result.dimensionScores[dimension]}<span>/100</span></dd></div>)}</dl>;
}

export default function DiagnosticTool() {
  const [step, setStep] = useState(0);
  const [context, setContext] = useState<Context>(emptyContext);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [submittedResult, setSubmittedResult] = useState<DiagnosticResult | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const submissionId = useRef("");
  const panelHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.history.replaceState({ ...window.history.state, diagnosticStep: 0 }, "", window.location.pathname + window.location.search);
    const onPopState = (event: PopStateEvent) => setStep(typeof event.state?.diagnosticStep === "number" ? event.state.diagnosticStep : 0);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => { if (step > 0) panelHeading.current?.focus(); }, [step]);

  const stepQuestions = useMemo(() => step > 1 && step <= 6 ? questions.filter((question) => question.dimension === stages[step - 1].id) : [], [step]);

  function go(next: number) {
    window.history.pushState({ ...window.history.state, diagnosticStep: next }, "", next === 0 ? window.location.pathname : `#${next === 7 ? "result" : stages[next - 1].id}`);
    setStep(next);
  }

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 6) { go(step + 1); return; }
    const completed = calculateResult(answers as Answers);
    setResult(completed);
    setSubmittedResult(null);
    go(7);
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result || sending) return;
    const form = event.currentTarget;
    submissionId.current ||= crypto.randomUUID();
    setSending(true);
    setError("");
    try {
      const fields = new FormData(form);
      const response = await fetch("/api/content-workflow-diagnostic/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submissionId.current, email: fields.get("email"), company: fields.get("company"), ...context, answers }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json();
      if (!response.ok || !data.submitted) throw new Error(data.error || "The report could not be sent. Please try again.");
      setSubmittedResult(data.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The report could not be sent. Please try again.");
    } finally { setSending(false); }
  }

  if (step === 0) return <section className={styles.hero} aria-labelledby="diagnostic-title">
    <p className="section-eyebrow">CONTENT WORKFLOW DIAGNOSTIC</p>
    <h1 id="diagnostic-title">How well does your content operation actually work?</h1>
    <p className={styles.intro}>Answer 15 questions to find the biggest bottlenecks in your content workflow, AI use and quality control.</p>
    <p className={styles.support}>Takes around 4 minutes. See your initial result before entering your email.</p>
    <p className={styles.dimensions}>Strategy · Knowledge · Workflow · AI readiness · Quality control</p>
    <button type="button" className="action action--primary" onClick={() => go(1)}>Start the diagnostic</button>
  </section>;

  if (step <= 6) return <section className={styles.diagnostic} aria-labelledby="step-title">
    <header className={styles.stepHeader}>
      <p className={styles.progressText}>Step {step} of 6</p>
      <progress value={step} max={6}>Step {step} of 6</progress>
      <h1 id="step-title" ref={panelHeading} tabIndex={-1}>{stages[step - 1].label}</h1>
      {step > 1 && <p>{`Questions ${stepQuestions[0].number}–${stepQuestions[stepQuestions.length - 1].number} of 15`}</p>}
    </header>
    <form className={styles.stepForm} onSubmit={next}>
      {step === 1 ? <>
        <ChoiceGroup name="role" legend="Role" choices={contextOptions.role} value={context.role} onChange={(role) => setContext({ ...context, role })} />
        <ChoiceGroup name="teamSize" legend="Content team size" choices={contextOptions.teamSize} value={context.teamSize} onChange={(teamSize) => setContext({ ...context, teamSize })} />
        <ChoiceGroup name="monthlyOutput" legend="Approximate monthly content output" choices={contextOptions.monthlyOutput} value={context.monthlyOutput} onChange={(monthlyOutput) => setContext({ ...context, monthlyOutput })} />
      </> : stepQuestions.map((question) => <ScoredQuestion key={question.id} question={question} value={answers[question.id]} onChange={(score) => setAnswers({ ...answers, [question.id]: score })} />)}
      <div className={styles.stepActions}><button type="button" className="action action--secondary" onClick={() => go(step - 1)}>Back</button><button type="submit" className="action action--primary">{step === 6 ? "See my result" : "Continue"}</button></div>
    </form>
  </section>;

  if (!result) return null;
  const full = submittedResult;
  return <article className={styles.results} aria-labelledby="result-title">
    <header className={styles.resultHeader}>
      <p className={styles.resultEyebrow}>Your initial result</p>
      <h1 id="result-title" ref={panelHeading} tabIndex={-1}>{result.overallScore}<span>/100</span></h1>
      <p className={styles.band}>{result.maturityBand}</p>
    </header>
    <section aria-labelledby="scores-title"><h2 id="scores-title">Your five dimensions</h2><ScoreList result={result} /></section>
    <section className={styles.primarySignal} aria-labelledby="bottleneck-title">
      <p className={styles.resultEyebrow}>Primary bottleneck</p>
      <h2 id="bottleneck-title">{dimensionLabels[result.primaryBottleneck]}</h2>
      <p>{result.primaryDiagnosis}</p>
      <h3>First move</h3><p>{result.immediateRecommendation}</p>
    </section>
    {!full && <section className={styles.emailGate} aria-labelledby="gate-title">
      <h2 id="gate-title">Get your full diagnostic</h2>
      <p>See your complete five-part assessment, three priority improvements and the AI opportunities most relevant to your workflow.</p>
      <form onSubmit={submitLead} aria-busy={sending}>
        <div className={styles.field}><label htmlFor="diagnostic-email">Work email</label><input id="diagnostic-email" name="email" type="email" required maxLength={254} autoComplete="email" disabled={sending} /></div>
        <div className={styles.field}><label htmlFor="diagnostic-company">Company or website <span>(optional)</span></label><input id="diagnostic-company" name="company" maxLength={300} autoComplete="organization" disabled={sending} /></div>
        <p className={styles.privacy}>I&apos;ll use your email to send this diagnostic. I won&apos;t add you to a marketing list unless you separately choose to subscribe.</p>
        <button type="submit" className="action action--primary" disabled={sending}>{sending ? "Sending your diagnostic…" : "Show me the full diagnostic"}</button>
        <div role="alert" aria-live="assertive">{error}</div>
      </form>
    </section>}
    {full && <section className={styles.fullReport} aria-labelledby="full-report-title">
      <header><p className={styles.resultEyebrow}>Full report</p><h2 id="full-report-title">Your complete five-part assessment</h2><p role="status">Your diagnostic has been sent to your email.</p></header>
      <div className={styles.interpretations}>{dimensions.map((dimension) => <section key={dimension}><h3>{dimensionLabels[dimension]} <span>{full.dimensionScores[dimension]}/100</span></h3><p>{dimensionInterpretations[dimension]} This places the area in the {scoreBand(full.dimensionScores[dimension]).label.toLowerCase()} range.</p></section>)}</div>
      <section><h2>Primary bottleneck</h2><h3>{dimensionLabels[full.primaryBottleneck]}</h3><p>{full.primaryDiagnosis}</p></section>
      <section><h2>Risk flags</h2>{full.riskFlags.length ? <div className={styles.reportList}>{full.riskFlags.map((flag) => <article key={flag.id}><h3>{flag.title}</h3><p>{flag.copy}</p></article>)}</div> : <p>No priority risk flags were triggered.</p>}</section>
      <section><h2>Three priority improvements</h2><ol className={styles.priorityList}>{full.priorities.map((item) => <li key={item.dimension}><h3>{item.label}</h3><p>{item.recommendation}</p></li>)}</ol></section>
      <section><h2>Relevant AI opportunities</h2>{full.aiOpportunities.length ? <div className={styles.reportList}>{full.aiOpportunities.map((item) => <article key={item.id}><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div> : <p>No immediate AI opportunity was prioritised ahead of the wider workflow improvements.</p>}</section>
      <section className={styles.contactCta}><h2>Want me to look at the system behind the score?</h2><p>If content is taking too long, AI isn&apos;t improving quality, or your team keeps solving the same problems repeatedly, I can help work out what actually needs redesigning.</p><Link className="action action--primary" href="/contact/">Talk through my content system</Link></section>
    </section>}
  </article>;
}
