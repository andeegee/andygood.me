import type { ReactNode } from "react";
import { ActionLink, Placeholder, Section } from "@/components/primitives";

export function PageShell({ title, placeholder, back, children }: {
  title: string;
  placeholder: string;
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <Section aria-labelledby="page-title">
      <div className="page-stack">
        {back ? <ActionLink href={back.href} variant="text">{back.label}</ActionLink> : null}
        <h1 id="page-title">{title}</h1>
        <Placeholder>{placeholder}</Placeholder>
        {children}
      </div>
    </Section>
  );
}
