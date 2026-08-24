"use client";

import { useState } from "react";
import { toggleHelpfulReaction } from "@/app/lib/reaction-actions";

// 「この投稿から学びがあった」ことを投稿者に伝える専用リアクション。
// LikeButton.tsx(一般的ないいね)と同じ楽観トグルの最小構成だが、
// 意図的に色(teal)を分けて別物であることが分かるようにしている。
export function HelpfulButton({
  postId,
  helpful,
  count,
}: {
  postId: string;
  helpful: boolean;
  count: number;
}) {
  const [localHelpful, setLocalHelpful] = useState(helpful);
  const [localCount, setLocalCount] = useState(count);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !localHelpful;
    setLocalHelpful(next);
    setLocalCount((c) => c + (next ? 1 : -1));
    void toggleHelpfulReaction(postId);
  }

  return (
    <button
      type="button"
      aria-pressed={localHelpful}
      aria-label="参考になった"
      onClick={handleClick}
      className={`inline-flex items-center gap-1 rounded-full font-mono text-[11px] transition-transform active:scale-90 ${
        localHelpful ? "text-[var(--teal)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
      }`}
    >
      <span aria-hidden>📖</span>
      参考になった{localCount > 0 && ` ${localCount}`}
    </button>
  );
}
