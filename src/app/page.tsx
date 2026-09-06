import { ActionLink, Placeholder, Section } from "@/components/primitives";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Andy Good", "/", "[HOMEPAGE META DESCRIPTION]");

export default function HomePage() {
  return <>
    <Section aria-labelledby="page-title"><div className="page-stack hero">
      <p className="hero-eyebrow">Senior Content &amp; AI Strategist</p>
      <h1 id="page-title" className="hero-title">
        <span>Make complex things clear.</span>{" "}
        <span>Make clear things convert.</span>
      </h1>
      <p className="hero-summary">I help SaaS and technology teams sharpen the message, improve content performance and build smarter systems behind the work.</p>
      <div className="actions">
        <ActionLink href="/work-with-me/">Work with me</ActionLink>
        <ActionLink href="/work/" variant="secondary">View selected work</ActionLink>
      </div>
    </div></Section>
    <Section aria-labelledby="selected-work"><div className="page-stack"><h2 id="selected-work">[SELECTED WORK]</h2><div className="placeholder-panel"><Placeholder>[SELECTED WORK CONTENT]</Placeholder></div></div></Section>
  </>;
}
