"use client";

import { useState } from "react";
import { extractYouTubeVideoId } from "@/app/lib/youtube";
import { YouTubeCard } from "./YouTubeCard";

// 投稿フォーム(PostComposer/TimelinePostForm)で共通のYouTube URL入力+
// サムネイルのライブプレビュー。ImagePickerButton.tsxと同じく「押すと
// 入力欄が現れる」形にして、普段は composer を圧迫しないようにしている。
export function YouTubeUrlInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const videoId = value ? extractYouTubeVideoId(value) : null;

  if (!open && !value) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1 rounded-full border border-[var(--line)] px-2.5 text-[11px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
      >
        ▶️ YouTube
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="youtubeUrl"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="min-w-[200px] flex-1 rounded-full border border-[var(--line)] bg-transparent px-2.5 py-1 text-[12px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          aria-label="YouTubeリンクを削除"
          className="shrink-0 text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ✕
        </button>
      </div>
      {value && (videoId ? <YouTubeCard youtubeUrl={value} className="max-w-[220px]" /> : (
        <p className="text-[11px] text-[var(--ink-faint)]">YouTubeのURLとして認識できていません</p>
      ))}
    </div>
  );
}
