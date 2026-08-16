"use client";

import { useActionState, useEffect, useRef } from "react";
import { createComment, type CreateCommentState } from "@/app/lib/comment-actions";

const initialState: CreateCommentState = {};

export function CommentForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(createComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <textarea
        name="body"
        placeholder="コメントを書く…"
        rows={2}
        maxLength={500}
        required
        className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-[var(--accent)]">{state.error}</span>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-[var(--accent)] px-4 py-1.5 text-[13px] font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40"
        >
          {pending ? "送信中…" : "コメントする"}
        </button>
      </div>
    </form>
  );
}
