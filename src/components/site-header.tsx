"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { navigation } from "@/lib/site";
import { Button, Container } from "@/components/primitives";

export function SiteHeader() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <header className="site-header" onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpenPath(null);
        toggle.current?.focus();
      }
    }}>
      <Container className="header-inner">
        <Link className="site-name" href="/" aria-label="Andy Good, home" onClick={() => setOpenPath(null)}>Andy Good</Link>
        <Button className="menu-toggle" ref={toggle} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpenPath(open ? null : pathname)}>
          {open ? "Close menu" : "Menu"}
        </Button>
        <nav id="primary-navigation" className="primary-navigation" aria-label="Main" data-open={open}>
          <ul>
            {navigation.map(({ href, label }) => (
              <li key={href}><Link href={href} aria-current={pathname === href || pathname.startsWith(href) ? "page" : undefined} onClick={() => setOpenPath(null)}>{label}</Link></li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
