"use client";

import { useActionState, useEffect, useState } from "react";
import { updatePost, type UpdatePostState } from "@/app/lib/post-actions";

const initialState: UpdatePostState = {};

// 投稿(つぶやき・制作タイムライン投稿共通)の本文を表示⇔編集トグルで
// 見せる。BioEditor.tsx(プロフィールの自己紹介編集)と同じパターン。
// 呼び出し元によって本文のフォントサイズ等が違うため、bodyClassNameで
// 上書きできるようにしている。
export function PostEditor({
  postId,
  body,
  bodyClassName = "text-[15px] leading-relaxed text-[var(--ink)]",
}: {
  postId: string;
  body: string;
  bodyClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updatePost, initialState);

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Actionの成功を受けて編集モードを閉じる
      setEditing(false);
    }
  }, [state.success]);

  if (!editing) {
    return (
      <div className="flex items-start gap-2">
        {body && <p className={`flex-1 whitespace-pre-line ${bodyClassName}`}>{body}</p>}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          編集
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="body"
        defaultValue={body}
        maxLength={280}
        rows={3}
        autoFocus
        className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-[var(--accent)]">{state.error}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--accent)] px-3 py-1 text-[12px] font-medium text-[var(--accent-ink)] disabled:opacity-40"
          >
            {pending ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </form>
  );
}
