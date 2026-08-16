"use client";

import type { ChangeEvent, RefObject } from "react";

// 投稿フォーム(PostComposer/TimelinePostForm/CommentForm)で共通の
// 画像選択ボタン+プレビュー。プレビュー用のblob URL状態は各フォーム側で
// 持たせ(フォームのリセットタイミングで一緒にクリアする必要があるため)、
// この部品自体は見た目だけを担当する。
export function ImagePickerButton({
  fileInputRef,
  preview,
  onChange,
  onClear,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  preview: string | null;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]">
        📷 画像
        <input
          ref={fileInputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={onChange}
          className="hidden"
        />
      </label>
      {preview && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- ローカルのblob URLプレビューなのでnext/imageの最適化対象外 */}
          <img src={preview} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <button
            type="button"
            onClick={onClear}
            aria-label="画像を削除"
            className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[var(--ink)] text-[9px] text-[var(--bg)]"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
