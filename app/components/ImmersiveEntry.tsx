"use client";

import { useState } from "react";
import type { Post, ReactionKey, Work } from "@/app/lib/mock-data";
import { ImmersiveViewer } from "./ImmersiveViewer";

export function ImmersiveEntry({
  works,
  posts,
  myReactions,
}: {
  works: Work[];
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-4 sm:px-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
      >
        <span aria-hidden>🎬</span>
        スワイプで発見
        <span aria-hidden className="text-[var(--accent)]">
          →
        </span>
      </button>

      {open && (
        <ImmersiveViewer works={works} posts={posts} myReactions={myReactions} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
