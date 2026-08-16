"use client";

import { useActionState, useRef, useState, type ChangeEvent } from "react";
import type { Work } from "@/app/lib/mock-data";
import { PLATFORM_META, PLATFORM_ORDER } from "@/app/lib/platform-meta";
import { updateProject, type UpdateProjectState } from "@/app/lib/project-actions";
import { ImagePickerButton } from "./ImagePickerButton";

const CATEGORIES = [
  "Webアプリ",
  "スマホアプリ",
  "PCアプリ",
  "ゲーム",
  "AIツール",
  "AI Agent",
  "拡張機能",
  "プロトタイプ",
] as const;
const STAGES = ["アイデア", "プロトタイプ", "ベータ", "公開中"] as const;
const TOOL_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "アイデアのみ(ツール未定)" },
  { value: "self", label: "AIを使わず自作" },
  { value: "Claude", label: "Claude" },
  { value: "ChatGPT", label: "ChatGPT" },
  { value: "Gemini", label: "Gemini" },
  { value: "Bolt", label: "Bolt" },
  { value: "v0", label: "v0" },
  { value: "Cursor", label: "Cursor" },
];

const initialState: UpdateProjectState = {};

const inputClass =
  "rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]";
const labelClass = "text-[12px] font-medium text-[var(--ink-soft)]";

export function ProjectEditForm({ work }: { work: Work }) {
  const [state, formAction, pending] = useActionState(updateProject, initialState);
  const [imagePreview, setImagePreview] = useState<string | null>(work.coverImageUrl ?? null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setImageRemoved(false);
  }

  function clearImage() {
    setImagePreview(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form action={formAction} encType="multipart/form-data" className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={work.id} />
      <input type="hidden" name="removeCoverImage" value={imageRemoved ? "1" : ""} />

      <label className="flex flex-col gap-1">
        <span className={labelClass}>カバー画像(空欄可)</span>
        <ImagePickerButton
          fileInputRef={fileInputRef}
          preview={imagePreview}
          onChange={handleImageChange}
          onClear={clearImage}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>タイトル</span>
        <input type="text" name="title" defaultValue={work.title} maxLength={40} required className={inputClass} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>説明文</span>
        <textarea
          name="catchText"
          defaultValue={work.catch}
          maxLength={200}
          rows={3}
          required
          className={`resize-none ${inputClass}`}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>カテゴリ</span>
          <select name="category" defaultValue={work.category} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>ステージ</span>
          <select name="stage" defaultValue={work.stage} className={inputClass}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>使ったツール</span>
        <select name="tool" defaultValue={work.tool ?? ""} className={inputClass}>
          {TOOL_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={labelClass}>対応環境</legend>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORM_ORDER.map((p) => (
            <label
              key={p}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-[12px] text-[var(--ink-soft)] has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-soft)] has-[:checked]:text-[var(--accent)]"
            >
              <input type="checkbox" name="platforms" value={p} defaultChecked={work.platforms.includes(p)} className="sr-only" />
              <span aria-hidden>{PLATFORM_META[p].icon}</span>
              {PLATFORM_META[p].label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>アイコン(絵文字1〜2文字、空欄可)</span>
        <input
          type="text"
          name="glyph"
          defaultValue={work.glyph ?? ""}
          maxLength={4}
          placeholder="🍳"
          className={`w-24 ${inputClass}`}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>GitHubリポジトリ(空欄可)</span>
        <input
          type="text"
          name="githubUrl"
          defaultValue={work.githubUrl ?? ""}
          placeholder="https://github.com/your/repo"
          className={inputClass}
        />
      </label>

      {state.error && <p className="text-[13px] text-[var(--accent)]">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-[var(--accent)] px-5 py-2 text-[14px] font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40"
      >
        {pending ? "保存中…" : "保存する"}
      </button>
    </form>
  );
}
