"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { createComment, type CreateCommentState } from "@/app/lib/comment-actions";
import { ImagePickerButton } from "./ImagePickerButton";

const initialState: CreateCommentState = {};

export function CommentForm({ target }: { target: { type: "project" | "post"; id: string } }) {
  const [state, formAction, pending] = useActionState(createComment, initialState);
  const [body, setBody] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  }, [state.success]);

  const trimmed = body.trim();

  return (
    <form ref={formRef} action={formAction} encType="multipart/form-data" className="flex flex-col gap-2">
      <input type="hidden" name="targetType" value={target.type} />
      <input type="hidden" name="targetId" value={target.id} />
      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="コメントを書く…"
        rows={2}
        maxLength={500}
        className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
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
          className="shrink-0 rounded-full bg-[var(--accent)] px-4 py-1.5 text-[13px] font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40"
        >
          {pending ? "送信中…" : "コメントする"}
        </button>
      </div>
    </form>
  );
}
