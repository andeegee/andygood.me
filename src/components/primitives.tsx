import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container ${className}`}>{children}</div>;
}

export function Section({ children, className = "", ...props }: ComponentProps<"section">) {
  return <section className={`section ${className}`} {...props}><Container>{children}</Container></section>;
}

type LinkProps = ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "text" };

export function ActionLink({ variant = "primary", className = "", ...props }: LinkProps) {
  return <Link className={`action action--${variant} ${className}`} {...props} />;
}

export function Button({ className = "", type = "button", ...props }: ComponentProps<"button">) {
  return <button type={type} className={`action action--secondary ${className}`} {...props} />;
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <p className="placeholder">{children}</p>;
}
