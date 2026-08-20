"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react";
import { POST_TYPE_META } from "@/app/lib/mock-data";
import { GUEST_POST_LIMIT } from "@/app/lib/guest-limits";
import { inferPostType } from "@/app/lib/infer-post-type";
import { createPost, type CreatePostState } from "@/app/lib/post-actions";
import { ImagePickerButton } from "./ImagePickerButton";
import { YouTubeUrlInput } from "./YouTubeUrlInput";

const initialState: CreatePostState = {};

// 作品詳細ページからその場でタイムラインに追記するための簡易フォーム。
// トップページのPostComposerと違い、紐付け先はこのProjectに固定なので
// セレクタは出さず、hidden inputでprojectTargetを渡すだけにしている。
// 表示自体は作品の作者本人にしか出ない(WorkDetail.tsx参照)が、その
// 作者がゲスト(まだログインしていない訪問者が自分の作品を作った場合)の
// こともあるため、PostComposerToggle.tsxと同じGUEST_POST_LIMITのガードを
// ここにも入れている(createPost自体は既に上限を検証済みだが、UIとして
// 残り件数が見えないと不親切なため)。
export function TimelinePostForm({
  projectId,
  isLoggedIn,
  guestPostCount,
}: {
  projectId: string;
  isLoggedIn: boolean;
  // ログイン済みの場合は上限が無いので無視される。
  guestPostCount: number;
}) {
  const [state, formAction, pending] = useActionState(createPost, initialState);
  const [body, setBody] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [resetCount, setResetCount] = useState(0);
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
      setYoutubeUrl("");
      setResetCount((c) => c + 1);
    }
  }, [state.success]);

  const trimmed = body.trim();
  const guessedType = inferPostType(body);
  const guestRemaining = GUEST_POST_LIMIT - guestPostCount;

  if (!isLoggedIn && guestRemaining <= 0) {
    return (
      <Link
        href="/login"
        className="flex w-full items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-3 text-left text-[15px] text-[var(--ink-faint)] transition-colors hover:border-[var(--accent)]"
      >
        <span aria-hidden>✎</span>
        ゲストの投稿は{GUEST_POST_LIMIT}件までです。続けて投稿するにはログインしてください
      </Link>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      encType="multipart/form-data"
      className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3"
    >
      <input type="hidden" name="projectTarget" value={projectId} />
      {!isLoggedIn && (
        <p className="mb-2 text-[12px] text-[var(--ink-faint)]">
          🔓 ログインなしでもあと{guestRemaining}件投稿できます(ログインすると無制限に投稿できます)
        </p>
      )}
      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="進捗を投稿する(未完成でもOK)"
        rows={2}
        maxLength={280}
        className="w-full resize-none border-none bg-transparent text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ImagePickerButton
          fileInputRef={fileInputRef}
          preview={imagePreview}
          onChange={handleImageChange}
          onClear={clearImage}
        />
        <YouTubeUrlInput key={resetCount} value={youtubeUrl} onChange={setYoutubeUrl} />
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
  );
}
