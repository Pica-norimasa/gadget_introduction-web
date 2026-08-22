"use client";

import { useTransition } from "react";
import { deleteComment } from "@/app/lib/comment-actions";

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deleteComment(commentId))}
      className="shrink-0 text-[11px] text-[var(--ink-faint)] hover:text-[var(--accent)] disabled:opacity-40"
    >
      {pending ? "削除中…" : "削除"}
    </button>
  );
}
