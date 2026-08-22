"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { updatePost, type UpdatePostState } from "@/app/lib/post-actions";
import { ImagePickerButton } from "./ImagePickerButton";
import { LinkifiedText } from "./LinkifiedText";
import { YouTubeCard } from "./YouTubeCard";
import { YouTubeUrlInput } from "./YouTubeUrlInput";

const initialState: UpdatePostState = {};

// 投稿(つぶやき・制作タイムライン投稿共通)の本文・画像・YouTubeリンクを
// まとめて表示⇔編集トグルで見せる。BioEditor.tsx(プロフィールの自己紹介
// 編集)と同じパターン。以前は本文だけの編集で、画像/YouTubeリンクは
// 呼び出し元(post/[id]/page.tsx・WorkDetail.tsx)がそれぞれ別に表示用の
// <img>/<YouTubeCard>を重複して描画していたが、編集中もその古い表示が
// 残ってしまう(編集フォームと二重表示になる)ため、表示・編集の両方を
// この部品に一本化した。非オーナーの表示(editingボタンを出さないだけの
// 同じ見た目)もここでまとめて担う。
export function PostEditor({
  postId,
  body,
  imageUrl,
  youtubeUrl,
  isOwner,
  bodyClassName = "text-[15px] leading-relaxed text-[var(--ink)]",
  imageClassName = "mt-2 max-h-80 max-w-full rounded-xl border border-[var(--line)] object-contain",
  youtubeClassName = "mt-2 max-w-xs",
}: {
  postId: string;
  body: string;
  imageUrl?: string;
  youtubeUrl?: string;
  isOwner: boolean;
  bodyClassName?: string;
  imageClassName?: string;
  youtubeClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updatePost, initialState);
  const [imagePreview, setImagePreview] = useState<string | null>(imageUrl ?? null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [youtubeValue, setYoutubeValue] = useState(youtubeUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Actionの成功を受けて編集モードを閉じる
      setEditing(false);
    }
  }, [state.success]);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setImageRemoved(false);
  }

  function clearImage() {
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!isOwner || !editing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          {body && (
            <p className={`flex-1 whitespace-pre-line ${bodyClassName}`}>
              <LinkifiedText text={body} />
            </p>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
            >
              編集
            </button>
          )}
        </div>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
          <img src={imageUrl} alt="" className={imageClassName} />
        )}
        {youtubeUrl && <YouTubeCard youtubeUrl={youtubeUrl} className={youtubeClassName} />}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="postId" value={postId} />
      {imageRemoved && <input type="hidden" name="removeImage" value="1" />}
      <textarea
        name="body"
        defaultValue={body}
        maxLength={280}
        rows={3}
        autoFocus
        className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
      />
      <div className="flex flex-wrap items-center gap-2">
        <ImagePickerButton
          fileInputRef={fileInputRef}
          preview={imagePreview}
          onChange={handleImageChange}
          onClear={clearImage}
        />
        <YouTubeUrlInput value={youtubeValue} onChange={setYoutubeValue} />
      </div>
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
