"use client";

import { useState } from "react";
import { toggleBookmark } from "@/app/lib/bookmark-actions";

// リアクションと違い公開の反応ではなく、自分だけの非公開の「あとで見る」
// 保存なのでカウント表示は無い(押した/押していないの二値のみ)。
export function BookmarkButton({
  target,
  bookmarked,
  size = "sm",
  className = "",
}: {
  target: { type: "project" | "post"; id: string };
  bookmarked: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const [localBookmarked, setLocalBookmarked] = useState(bookmarked);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLocalBookmarked((v) => !v);
    void toggleBookmark(target);
  }

  return (
    <button
      type="button"
      aria-pressed={localBookmarked}
      aria-label={localBookmarked ? "ブックマークを解除" : "あとで見る(ブックマーク)"}
      title={localBookmarked ? "ブックマークを解除" : "あとで見る(ブックマーク)"}
      onClick={handleClick}
      className={`inline-flex shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 ${
        size === "md" ? "h-8 w-8 border border-[var(--line)]" : "h-6 w-6"
      } ${localBookmarked ? "text-[var(--accent)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill={localBookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 4a1 1 0 0 1 1 -1h10a1 1 0 0 1 1 1v16l-6 -4l-6 4z" />
      </svg>
    </button>
  );
}
