"use client";

import { openComposer } from "@/app/lib/composer-store";

function scrollToComposer() {
  document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function OpenComposerButton({ label = "つぶやく" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        openComposer();
        requestAnimationFrame(scrollToComposer);
      }}
      className="rounded-full border border-[var(--line)] px-3 py-1 text-[var(--ink-soft)] hover:border-[var(--accent)]"
    >
      {label}
    </button>
  );
}
