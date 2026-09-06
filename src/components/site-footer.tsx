import Link from "next/link";
import { Container } from "@/components/primitives";
import { navigation } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="footer-inner">
        <Link className="site-name" href="/">Andy Good</Link>
        <nav aria-label="Footer"><ul>{navigation.map(({ href, label }) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></nav>
      </Container>
    </footer>
  );
}
