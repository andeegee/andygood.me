"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { contactSchema, contactErrors, contactTopics, type ContactErrors } from "@/lib/contact";
import styles from "./contact.module.css";

export function ContactForm() {
  const [errors, setErrors] = useState<ContactErrors>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const submissionId = useRef("");
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pending) return;
    const first = Object.keys(errors)[0];
    if (first) (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
    if (sent) successRef.current?.focus();
  }, [errors, pending, sent]);

  function showErrors(fields: ContactErrors) {
    setErrors(fields);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    submissionId.current ||= crypto.randomUUID();
    const parsed = contactSchema.safeParse({ ...Object.fromEntries(new FormData(form)), submissionId: submissionId.current });
    setError("");
    if (!parsed.success) { showErrors(contactErrors(parsed.error)); return; }
    setErrors({});
    setPending(true);
    try {
      const response = await fetch("/api/contact/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok || !result.sent) {
        if (result.errors) showErrors(result.errors);
        setError(result.error || "Your message could not be sent. Please try again, or email letschat@andygood.me.");
      } else { setSent(true); }
    } catch { setError("Sending could not be confirmed. Your message is still here. Please try again, or email letschat@andygood.me."); }
    finally { setPending(false); }
  }

  const describedBy = (name: keyof ContactErrors) => errors[name] ? `${name}-error` : undefined;
  const fieldError = (name: keyof ContactErrors) => errors[name] && <p id={`${name}-error`} className={styles.error}>{errors[name]}</p>;

  return <div>
    <div role="status" aria-live="polite" aria-atomic="true">
      {sent && <div ref={successRef} tabIndex={-1} className={styles.success}><h2>Message sent.</h2><p>Thanks. I’ll take a look and get back to you as soon as I can.</p></div>}
    </div>
    {!sent && <form ref={formRef} className={styles.form} onSubmit={submit} noValidate aria-label="Contact Andy" aria-busy={pending}>
      <fieldset disabled={pending}>
        <div className={styles.pair}>
          <div className={styles.field}><label htmlFor="name">Name <span>(required)</span></label><input id="name" name="name" autoComplete="name" required maxLength={100} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} />{fieldError("name")}</div>
          <div className={styles.field}><label htmlFor="email">Work email <span>(required)</span></label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={!!errors.email} aria-describedby={describedBy("email")} />{fieldError("email")}</div>
        </div>
        <div className={styles.field}><label htmlFor="company">Company <span>(optional)</span></label><input id="company" name="company" autoComplete="organization" maxLength={150} aria-invalid={!!errors.company} aria-describedby={describedBy("company")} />{fieldError("company")}</div>
        <div className={styles.field}><label htmlFor="topic">What do you need help with? <span>(required)</span></label><select id="topic" name="topic" required defaultValue="" aria-invalid={!!errors.topic} aria-describedby={describedBy("topic")}><option value="" disabled>Select an option</option>{contactTopics.map((topic) => <option key={topic}>{topic}</option>)}</select>{fieldError("topic")}</div>
        <div className={styles.field}><label htmlFor="message">Message <span>(required)</span></label><textarea id="message" name="message" rows={6} required maxLength={5000} aria-invalid={!!errors.message} aria-describedby={["message-hint", describedBy("message")].filter(Boolean).join(" ")} /><p id="message-hint" className={styles.hint}>Up to 5,000 characters.</p>{fieldError("message")}</div>
        <div hidden aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off" maxLength={200} /></div>
        <button className="action action--primary" type="submit">{pending ? "Sending…" : "Send message"}</button>
      </fieldset>
      <div role="status" aria-live="polite">{pending ? "Sending your message…" : ""}</div>
      <div role="alert" aria-atomic="true">{error || (Object.keys(errors).length > 0 ? "Check the highlighted fields." : "")}</div>
      <noscript>Please enable JavaScript to use the form, or <a href="mailto:letschat@andygood.me">email Andy directly</a>.</noscript>
    </form>}
  </div>;
}
