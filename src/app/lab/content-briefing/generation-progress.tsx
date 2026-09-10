import { useEffect, useRef, useState } from "react";
import styles from "./tool.module.css";

const messages = [
  "Reading source material",
  "Extracting evidence and proof",
  "Checking gaps and unsupported claims",
  "Building strategic direction",
  "Structuring the brief",
  "Preparing the final draft",
];

export function GenerationProgress({ onCancel }: { onCancel: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const started = Date.now();
    panel.current?.focus({ preventScroll: true });
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <section ref={panel} tabIndex={-1} className={styles.progress} aria-label="Generating draft" aria-describedby="generation-expectation generation-explanation">
    <div className={styles.progressBar} aria-hidden="true"><span /></div>
    <p role="status" aria-live="polite" aria-atomic="true" className={styles.progressMessage}>{messages[Math.floor(elapsed / 8) % messages.length]}</p>
    <p role="timer" aria-live="off">Working for {elapsed}s</p>
    <p id="generation-expectation">This can take up to three minutes.</p>
    <p id="generation-explanation" className={styles.progressExplanation}>Messages rotate while you wait. They do not report exact processing stages.</p>
    <button className="action action--secondary" type="button" onClick={onCancel}>Cancel</button>
  </section>;
}
