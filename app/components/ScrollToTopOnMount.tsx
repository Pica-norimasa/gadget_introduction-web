"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTopOnMount() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (window.location.hash) return;

    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    if (window.location.hash) return;

    const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(scrollToTop);
    const timers = [window.setTimeout(scrollToTop, 0), window.setTimeout(scrollToTop, 80), window.setTimeout(scrollToTop, 240)];

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname]);

  return null;
}
