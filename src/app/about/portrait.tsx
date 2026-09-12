"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./about.module.css";

export function AboutPortrait({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current!;
    const section = video.closest("section")!;
    const enabled = window.matchMedia("(min-width: 48rem) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let failed = false;

    const update = () => {
      frame = 0;
      if (!enabled.matches || failed || video.readyState < 2 || video.seeking) return;
      const rect = section.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      // Use the existing hero: finish while its lower half is still visible.
      const start = Math.max(0, top - window.innerHeight * 0.8);
      const end = top + rect.height * 0.5;
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / Math.max(1, end - start)));
      const target = progress * Math.min(4.2, video.duration);
      if (Number.isFinite(target) && Math.abs(video.currentTime - target) > 0.015) {
        video.currentTime = target;
      }
    };
    const schedule = () => {
      if (!frame && enabled.matches && !failed) frame = requestAnimationFrame(update);
    };
    const ready = () => {
      if (enabled.matches && !failed) video.dataset.ready = "true";
      schedule();
    };
    const fail = () => {
      failed = true;
      delete video.dataset.ready;
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const configure = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      delete video.dataset.ready;
      if (enabled.matches && !failed) {
        video.src = "/media/andy-about-handshake.mp4";
        video.load();
      } else {
        video.removeAttribute("src");
        video.load();
      }
    };

    video.addEventListener("loadeddata", ready);
    video.addEventListener("canplay", ready);
    video.addEventListener("seeked", schedule);
    video.addEventListener("error", fail);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    enabled.addEventListener("change", configure);
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    configure();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      enabled.removeEventListener("change", configure);
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("canplay", ready);
      video.removeEventListener("seeked", schedule);
      video.removeEventListener("error", fail);
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  return (
    <div className={styles.portrait}>
      <div className={styles.portraitFrame}>
        {children}
        <video ref={videoRef} className={styles.portraitVideo} muted playsInline preload="auto" aria-hidden="true" tabIndex={-1} />
      </div>
    </div>
  );
}
