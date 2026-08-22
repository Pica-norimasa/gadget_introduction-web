"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { StageUpView } from "@/app/lib/queries";

function seenKey(item: StageUpView): string {
  // projectId+stageで一意にする。同じ作品が後で別のステージにまた
  // 前進した場合は改めて祝えるように。
  return `draftly-stageup-seen:${item.id}:${item.stage}`;
}

// WelcomeModal.tsxと同じキー。初回訪問者にはまずサイト説明のポップアップを
// 優先させたい(2つのポップアップが独立にmountすると、初回訪問かつ直近の
// ステージアップがある場合に両方同時に開いてしまう不具合があったため、
// 「既にウェルカムを見た(=初回訪問ではない)」ことをこちらの表示条件に加えた)。
const WELCOME_SEEN_KEY = "draftly-welcome-seen";

// ホーム訪問時、直近でステージが前進した(project-actions.tsのupdateProject
// 参照)作品をサイト全体に向けてお祝いするポップアップ。WelcomeModalと同じく
// 「この端末で見たかどうか」だけをlocalStorageで判定する(サーバー往復不要)。
export function StageUpCelebration({ items }: { items: StageUpView[] }) {
  const [current, setCurrent] = useState<StageUpView | null>(null);

  useEffect(() => {
    if (!window.localStorage.getItem(WELCOME_SEEN_KEY)) return;
    const next = items.find((item) => !window.localStorage.getItem(seenKey(item)));
    if (next) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 既読判定はlocalStorage(クライアント専用)でしかできない
      setCurrent(next);
    }
  }, [items]);

  function close() {
    if (current) window.localStorage.setItem(seenKey(current), "1");
    setCurrent(null);
  }

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ステージアップのお知らせ"
      className="fixed inset-0 z-[55] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={close}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 text-center shadow-[0_8px_24px_var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-3xl" aria-hidden>
          🎉
        </p>
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]">
          {current.stage}にステップアップ!
        </h2>
        <p className="mb-4 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          {current.authorName}さんの「{current.title}」が{current.stage}に進みました。おめでとうございます!
        </p>
        <div className="flex flex-col items-center gap-2">
          <Link
            href={`/work/${current.id}`}
            onClick={close}
            className="w-full rounded-full bg-[var(--ink)] px-4 py-2.5 text-center text-[14px] font-medium text-[var(--bg)] hover:opacity-90"
          >
            見にいく →
          </Link>
          <button type="button" onClick={close} className="text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
