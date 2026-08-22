"use client";

import { openComposerWithPostType } from "@/app/lib/composer-store";
import type { PostType } from "@/app/lib/mock-data";

function scrollToComposer() {
  document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function OpenComposerButton({ label = "つぶやく", postType = "question" }: { label?: string; postType?: PostType }) {
  return (
    <button
      type="button"
      onClick={() => {
        openComposerWithPostType(postType);
        requestAnimationFrame(scrollToComposer);
      }}
      className="rounded-full border border-[var(--line)] px-3 py-1 text-[var(--ink-soft)] hover:border-[var(--accent)]"
    >
      {label}
    </button>
  );
}
