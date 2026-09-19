import Link from "next/link";
import { Container } from "@/components/primitives";
import { navigation } from "@/lib/site";
import { SiteLogo } from "@/components/site-logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="footer-inner">
        <Link className="site-brand" href="/" aria-label="Andy Good, home"><SiteLogo /></Link>
        <nav aria-label="Footer"><ul>{navigation.map(({ href, label }) => <li key={href}><Link href={href}>{label}</Link></li>)}<li><a className="footer-linkedin" href="https://www.linkedin.com/in/andy-good/" target="_blank" rel="noopener noreferrer" aria-label="Andy Good on LinkedIn (opens in a new tab)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM3.56 9h3.555v11.452H3.56z" /></svg><span>LinkedIn</span></a></li></ul></nav>
      </Container>
    </footer>
  );
}
