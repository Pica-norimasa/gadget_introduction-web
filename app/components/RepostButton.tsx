"use client";

import { useActionState, useEffect, useState } from "react";
import { quoteRepost, type QuoteRepostState } from "@/app/lib/repost-actions";
import { markReposted, toggleRepost, useHasReposted } from "@/app/lib/repost-store";

const initialQuoteState: QuoteRepostState = {};

function QuoteComposeForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(quoteRepost, initialQuoteState);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (state.success) {
      markReposted(projectId);
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDoneは呼び出し元で毎回新しい関数になり得るため依存に含めない
  }, [state.success, projectId]);

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <textarea
        name="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={200}
        rows={2}
        autoFocus
        placeholder="コメントを添えて紹介"
        className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-2.5 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-[var(--accent)]">{state.error}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDone}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={pending || !comment.trim()}
            className="rounded-full bg-[var(--accent)] px-3 py-1 text-[12px] font-medium text-[var(--accent-ink)] disabled:opacity-40"
          >
            {pending ? "投稿中…" : "コメント付き紹介"}
          </button>
        </div>
      </div>
    </form>
  );
}

// リアクションと違い、押した瞬間のカウントは楽観的に増減させない(💬コメント数
// と同じ扱い。revalidatePathで次の描画から反映される)。ボタン自体の
// 押下状態(自分がリポスト済みか)だけはグローバルなrepost-store経由で
// 即座に他のインスタンス(カード⇔詳細ページ)にも反映される。
//
// allowQuote: 引用リポスト(コメント付き)の選択肢を出すかどうか。
// WorkCardは横幅が狭く、選択メニューやコメント欄が入るとカード自体の
// overflow-hiddenで見切れてしまうため、余白のあるWorkDetailだけで
// trueにする想定。falseのときは未リポスト時のクリックが即座に
// 通常のリポストになる(元の挙動のまま)。
export function RepostButton({
  projectId,
  count,
  size = "sm",
  allowQuote = false,
}: {
  projectId: string;
  count: number;
  size?: "sm" | "md";
  allowQuote?: boolean;
}) {
  const reposted = useHasReposted(projectId);
  const [choosing, setChoosing] = useState(false);
  const [composing, setComposing] = useState(false);
  const padding = size === "md" ? "px-3 py-1.5 text-[13px]" : "px-2 py-1 text-[11px]";

  function handleClick() {
    if (reposted) {
      toggleRepost(projectId);
      setChoosing(false);
      setComposing(false);
      return;
    }
    if (!allowQuote) {
      toggleRepost(projectId);
      return;
    }
    setChoosing((v) => !v);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        aria-pressed={reposted}
        aria-label="紹介"
        title="紹介"
        onClick={handleClick}
        className={`inline-flex w-fit items-center gap-1 rounded-full border font-mono transition-all active:scale-90 ${padding} ${
          reposted
            ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
            : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
        }`}
      >
        <span aria-hidden>🔁</span>
        {count}
      </button>

      {choosing && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              toggleRepost(projectId);
              setChoosing(false);
            }}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
          >
            🔁 そのまま紹介
          </button>
          <button
            type="button"
            onClick={() => {
              setChoosing(false);
              setComposing(true);
            }}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
          >
            💬 コメント付きで紹介
          </button>
        </div>
      )}

      {composing && <QuoteComposeForm projectId={projectId} onDone={() => setComposing(false)} />}
    </div>
  );
}
