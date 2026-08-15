"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { POST_TYPE_META } from "@/app/lib/mock-data";
import { inferPostType } from "@/app/lib/infer-post-type";
import { createPost, type CreatePostState } from "@/app/lib/post-actions";

const initialState: CreatePostState = {};

export function PostComposer() {
  const [state, formAction, pending] = useActionState(createPost, initialState);
  const [body, setBody] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Actionの結果を受けてフォームをクリアする必要がある
      setBody("");
      formRef.current?.reset();
    }
  }, [state.success]);

  const trimmed = body.trim();
  const guessedType = inferPostType(body);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6">
      <form
        ref={formRef}
        action={formAction}
        className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4"
      >
        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="今なにか作ってますか？思いついたことをどうぞ(未完成・アイデアだけでもOK)"
          rows={2}
          maxLength={280}
          className="w-full resize-none border-none bg-transparent text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink-soft)] transition-opacity ${
              trimmed ? "opacity-100" : "opacity-0"
            }`}
          >
            {POST_TYPE_META[guessedType].icon} {POST_TYPE_META[guessedType].label}っぽい投稿として判定
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[11px] text-[var(--ink-faint)]">{body.length}/280</span>
            <button
              type="submit"
              disabled={!trimmed || pending}
              className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-[13px] font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40"
            >
              {pending ? "投稿中…" : "投稿する"}
            </button>
          </div>
        </div>
        {state.error && <p className="mt-2 text-[12px] text-[var(--accent)]">{state.error}</p>}
      </form>
    </div>
  );
}
