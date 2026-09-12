"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function observeReveals() {
  if (!("IntersectionObserver" in window)) return () => {};

  const targets = document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-group]");
  if (!targets.length) return () => {};

  document.documentElement.classList.add("motion-ready");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.17 });

  targets.forEach((target) => observer.observe(target));
  return () => {
    observer.disconnect();
    document.documentElement.classList.remove("motion-ready");
  };
}

function enableCursorGlow(pathname: string) {
  if (!(pathname === "/ai-lab" || pathname.startsWith("/ai-lab/") || pathname === "/website-friction-scan")) return () => {};
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => {};

  const cleanups = Array.from(document.querySelectorAll<HTMLElement>("main section[data-cursor-glow]"), (section) => {
    let frame = 0;
    let fadeTimer = 0;
    let clientX = 0;
    let clientY = 0;

    const hide = () => {
      window.clearTimeout(fadeTimer);
      window.cancelAnimationFrame(frame);
      frame = 0;
      section.classList.remove("is-cursor-active");
    };
    const move = (event: PointerEvent) => {
      clientX = event.clientX;
      clientY = event.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        section.style.setProperty("--cursor-x", `${clientX - rect.left}px`);
        section.style.setProperty("--cursor-y", `${clientY - rect.top}px`);
        section.classList.add("is-cursor-active");
        window.clearTimeout(fadeTimer);
        fadeTimer = window.setTimeout(hide, 700);
        frame = 0;
      });
    };

    section.addEventListener("pointermove", move, { passive: true });
    section.addEventListener("pointerleave", hide);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", hide);
      hide();
    };
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

export function MotionEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {};
    const initialise = () => {
      cleanup();
      if (reducedMotion.matches) {
        document.documentElement.classList.remove("motion-ready");
        cleanup = () => {};
        return;
      }
      const stopReveals = observeReveals();
      const stopGlow = enableCursorGlow(pathname);
      cleanup = () => { stopReveals(); stopGlow(); };
    };

    initialise();
    reducedMotion.addEventListener("change", initialise);
    return () => {
      reducedMotion.removeEventListener("change", initialise);
      cleanup();
    };
  }, [pathname]);

  return null;
}
