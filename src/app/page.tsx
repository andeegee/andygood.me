import { ActionLink, Placeholder, Section } from "@/components/primitives";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Andy Good", "/", "[HOMEPAGE META DESCRIPTION]");

export default function HomePage() {
  return <>
    <Section aria-labelledby="page-title"><div className="page-stack">
      <h1 id="page-title">[HOMEPAGE HERO COPY]</h1>
      <Placeholder>[HOMEPAGE INTRO COPY]</Placeholder>
      <div className="actions"><ActionLink href="/work/">Work</ActionLink><ActionLink href="/work-with-me/" variant="secondary">Ways to work</ActionLink></div>
    </div></Section>
    <Section aria-labelledby="selected-work"><div className="page-stack"><h2 id="selected-work">[SELECTED WORK]</h2><div className="placeholder-panel"><Placeholder>[SELECTED WORK CONTENT]</Placeholder></div></div></Section>
  </>;
}
