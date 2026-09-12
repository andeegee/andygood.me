import { pageMetadata } from "@/lib/metadata";
import { ContactForm } from "./form";
import styles from "./contact.module.css";

const title = "Contact Andy Good | Content & AI Strategy";
const baseMetadata = pageMetadata("Contact", "/contact/", "Contact Senior Content & AI Strategist Andy Good about content strategy, messaging, conversion, fractional strategy, AI-enabled content systems or senior copywriting.");
export const metadata = { ...baseMetadata, title: { absolute: title }, openGraph: { ...baseMetadata.openGraph, title }, twitter: { ...baseMetadata.twitter, title } };

export default function ContactPage() {
  return <div className={`container ${styles.page}`}>
    <header className={styles.hero}>
      <p className="hero-eyebrow">Contact</p>
      <h1>Tell me what’s getting in the way.</h1>
      <p>If the problem involves content, messaging, conversion, search, AI or the systems behind the work, send me a note.</p>
      <p>You don’t need to know which service you need. Tell me what’s happening and what you’re trying to improve.</p>
    </header>
    <div className={styles.grid}>
      <ContactForm />
      <aside className={styles.aside} aria-label="Other ways to get in touch">
        <section>
          <h2>Prefer email?</h2>
          <a className={styles.email} href="mailto:letschat@andygood.me">letschat@andygood.me</a>
          <p>Based in South Africa. Working remotely with clients internationally.</p>
        </section>
        <section className={styles.allmi}>
          <p>Looking for broader business automation or operational AI? That work sits under allmi.</p>
          <a href="https://allmi.online">Visit allmi</a>
        </section>
        <p className={styles.closing}><strong>Not sure where your problem fits?</strong><br />That’s fine. Start with the problem.</p>
      </aside>
    </div>
  </div>;
}
