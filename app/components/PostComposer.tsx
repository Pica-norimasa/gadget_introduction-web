"use client";

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { POST_TYPE_META, type Work } from "@/app/lib/mock-data";
import { inferPostType } from "@/app/lib/infer-post-type";
import { createPost, type CreatePostState } from "@/app/lib/post-actions";
import { ImagePickerButton } from "./ImagePickerButton";

const initialState: CreatePostState = {};

export function PostComposer({ myProjects }: { myProjects: Work[] }) {
  const [state, formAction, pending] = useActionState(createPost, initialState);
  const [body, setBody] = useState("");
  const [projectTarget, setProjectTarget] = useState("new");
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
      setProjectTarget("new");
      formRef.current?.reset();
      clearImage();

      if (state.projectId) {
        const projectId = state.projectId;
        // revalidatePath後の再レンダリングでカードがDOMに反映されてから
        // ハッシュを付けたい。location.hashを立てるとブラウザが自動で
        // #work-xxxまでスクロールし、WorkCardの`target:`スタイルで
        // リング枠が付く(DiceButton等と同じ仕組みを流用)。
        requestAnimationFrame(() => {
          window.location.hash = `work-${projectId}`;
        });
      }
    }
  }, [state.success, state.projectId]);

  const trimmed = body.trim();
  const guessedType = inferPostType(body);

  return (
    <div id="composer" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-6 sm:px-6">
      <form
        ref={formRef}
        action={formAction}
        encType="multipart/form-data"
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
        <div className="mt-2">
          <ImagePickerButton
            fileInputRef={fileInputRef}
            preview={imagePreview}
            onChange={handleImageChange}
            onClear={clearImage}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            name="projectTarget"
            value={projectTarget}
            onChange={(e) => setProjectTarget(e.target.value)}
            className="rounded-full border border-[var(--line)] bg-[var(--bg-sunken)] px-2.5 py-1 text-[12px] text-[var(--ink-soft)] focus:outline-none"
          >
            <option value="new">🆕 新しいプロジェクトとして</option>
            <option value="">単独の投稿(プロジェクトに紐付けない)</option>
            {myProjects.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.title}
              </option>
            ))}
          </select>
          {projectTarget === "new" && (
            <input
              type="text"
              name="newProjectTitle"
              placeholder="プロジェクト名(空欄なら投稿内容から自動生成)"
              maxLength={40}
              className="min-w-[180px] flex-1 rounded-full border border-[var(--line)] bg-transparent px-2.5 py-1 text-[12px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
            />
          )}
        </div>
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
              disabled={(!trimmed && !imagePreview) || pending}
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
