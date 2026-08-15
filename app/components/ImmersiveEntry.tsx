"use client";

import { useState } from "react";
import type { Post, Work } from "@/app/lib/mock-data";
import { ImmersiveViewer } from "./ImmersiveViewer";

export function ImmersiveEntry({ works, posts }: { works: Work[]; posts: Post[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-4 sm:px-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] px-5 py-3 text-left transition-colors hover:border-[var(--accent)]"
      >
        <span>
          <span className="block text-[15px] font-bold text-[var(--ink)]">🎬 没入で発見する</span>
          <span className="block text-[12px] text-[var(--ink-faint)]">
            次々に作品が流れてきます。スクロールするだけ
          </span>
        </span>
        <span aria-hidden className="text-[var(--accent)]">
          →
        </span>
      </button>

      {open && <ImmersiveViewer works={works} posts={posts} onClose={() => setOpen(false)} />}
    </div>
  );
}
