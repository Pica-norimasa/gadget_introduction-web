"use client";

import { useState } from "react";
import { toggleLike } from "@/app/lib/reaction-actions";

// 単独投稿(Post)向けのXのハートアイコンと同じ単純な二値トグル。
// ReactionBar(Projectの4種類リアクション)と違い種類の出し分けが
// 無いので、ローカルstateで楽観トグルするだけの最小構成にしている。
export function LikeButton({
  postId,
  liked,
  count,
  size = "sm",
}: {
  postId: string;
  liked: boolean;
  count: number;
  size?: "sm" | "md";
}) {
  const [localLiked, setLocalLiked] = useState(liked);
  const [localCount, setLocalCount] = useState(count);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !localLiked;
    setLocalLiked(next);
    setLocalCount((c) => c + (next ? 1 : -1));
    void toggleLike(postId);
  }

  return (
    <button
      type="button"
      aria-pressed={localLiked}
      aria-label="いいね"
      onClick={handleClick}
      className={`inline-flex items-center gap-1 rounded-full transition-transform active:scale-90 ${
        size === "md"
          ? "border border-[var(--line)] px-2.5 py-1 text-[13px]"
          : "font-mono text-[11px]"
      } ${localLiked ? "text-[var(--accent)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"}`}
    >
      <span aria-hidden>{localLiked ? "❤️" : "🤍"}</span>
      {localCount > 0 && localCount}
    </button>
  );
}
