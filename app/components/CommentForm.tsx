"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { autoGrow } from "@/app/lib/autogrow";
import { createComment, type CreateCommentState } from "@/app/lib/comment-actions";
import { GUEST_COMMENT_LIMIT } from "@/app/lib/guest-limits";
import { ImagePickerButton } from "./ImagePickerButton";

const initialState: CreateCommentState = {};

export function CommentForm({
  target,
  parentId,
  isLoggedIn,
  guestCommentCount,
  onDone,
}: {
  target: { type: "project" | "post"; id: string };
  // 指定するとその返信として投稿する(CommentThread.tsxが「返信する」
  // から開くフォームで使う)。
  parentId?: string;
  // コメントは荒らし対策として原則ログイン必須にしているが、投稿と同様
  // 「試しに使ってみたい」訪問者の摩擦を減らすため、未ログインでも
  // GUEST_COMMENT_LIMIT件まではコメントできる(comment-actions.ts参照)。
  isLoggedIn: boolean;
  // ログイン済みの場合は上限が無いので無視される。
  guestCommentCount: number;
  // 送信成功時に呼ばれる(返信フォームを自動で畳むために使う)。
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createComment, initialState);
  const [body, setBody] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function clearImage() {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Actionの結果を受けてフォームをクリアする必要がある
      setBody("");
      formRef.current?.reset();
      clearImage();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDoneは呼び出し元で毎回新しい関数になり得るため依存に含めない
  }, [state.success]);

  const trimmed = body.trim();
  const guestRemaining = GUEST_COMMENT_LIMIT - guestCommentCount;

  if (!isLoggedIn && guestRemaining <= 0) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)] p-3">
        <span className="text-[13px] text-[var(--ink-soft)]">
          ゲストのコメントは{GUEST_COMMENT_LIMIT}件までです。続けるにはログインしてください
        </span>
        <Link
          href="/login"
          className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1.5 text-[12px] font-medium text-[var(--accent-ink)]"
        >
          ログイン
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} encType="multipart/form-data" className="flex flex-col gap-2">
      <input type="hidden" name="targetType" value={target.type} />
      <input type="hidden" name="targetId" value={target.id} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      {!isLoggedIn && (
        <p className="text-[12px] text-[var(--ink-faint)]">
          🔓 ログインなしでもあと{guestRemaining}件コメントできます(ログインすると無制限にコメントできます)
        </p>
      )}
      <textarea
        ref={textareaRef}
        name="body"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          autoGrow(e.target);
        }}
        placeholder={parentId ? "返信を書く…" : "コメントを書く…"}
        rows={2}
        maxLength={500}
        autoFocus={!!parentId}
        className="w-full resize-none overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
      />
      <ImagePickerButton
        fileInputRef={fileInputRef}
        preview={imagePreview}
        onChange={handleImageChange}
        onClear={clearImage}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-[var(--accent)]">{state.error}</span>
        <button
          type="submit"
          disabled={(!trimmed && !imagePreview) || pending}
          className="h-8 shrink-0 rounded-full bg-[var(--accent)] px-4 text-[13px] font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40"
        >
          {pending ? "送信中…" : parentId ? "返信する" : "コメントする"}
        </button>
      </div>
    </form>
  );
}
