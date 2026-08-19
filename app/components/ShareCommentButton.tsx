"use client";

import Link from "next/link";
import { useState } from "react";
import { shareCommentAsPost } from "@/app/lib/comment-actions";

// クリックで即座につぶやきとして複製投稿する(下書きを開いて手で
// 投稿ボタンを押させる中間ステップを挟まない)。
export function ShareCommentButton({ commentId }: { commentId: string }) {
  const [state, setState] = useState<"idle" | "sharing" | "done" | "error">("idle");
  const [postId, setPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setState("sharing");
    const result = await shareCommentAsPost(commentId);
    if (result.success) {
      setPostId(result.postId ?? null);
      setState("done");
    } else {
      setError(result.error ?? "シェアに失敗しました");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <span className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] text-[var(--teal)]">
        🌱 つぶやきとしてシェアしました
        {postId && (
          <Link href={`/post/${postId}`} className="hover:underline">
            見る →
          </Link>
        )}
      </span>
    );
  }

  return (
    <span className="mt-1.5 inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "sharing"}
        className="text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)] disabled:opacity-50"
      >
        {state === "sharing" ? "シェア中…" : "🌱 つぶやきとしてもシェア"}
      </button>
      {state === "error" && <span className="text-[12px] text-[var(--accent)]">{error}</span>}
    </span>
  );
}
