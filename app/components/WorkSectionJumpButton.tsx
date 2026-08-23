"use client";

import type { ReactNode } from "react";

export function WorkSectionJumpButton({
  tabId,
  children,
  className,
}: {
  tabId: string;
  children: ReactNode;
  className?: string;
}) {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("draftly:work-section-tab", { detail: { tabId } }));
    requestAnimationFrame(() => {
      document.getElementById("work-sections")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
