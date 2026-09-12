import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionEffects } from "@/components/motion-effects";
import { isIndexable, site } from "@/lib/site";
import "./globals.css";

const instrumentSans = localFont({
  src: "../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2",
  variable: "--font-instrument-sans",
  weight: "400 700",
  style: "normal",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: "[SITE META DESCRIPTION]",
  robots: { index: isIndexable, follow: isIndexable },
  openGraph: { type: "website", locale: site.locale, siteName: site.name, title: site.name, description: "[SITE META DESCRIPTION]", url: site.url },
  twitter: { card: "summary", title: site.name, description: "[SITE META DESCRIPTION]" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={instrumentSans.variable}>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <SiteFooter />
        <MotionEffects />
      </body>
    </html>
  );
}
