"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { openComposer } from "@/app/lib/composer-store";

const STORAGE_KEY = "draftly-welcome-seen";
// Draftly自体の開発ログを投稿しているProject。タイムライン更新+コメントが
// 既にフィードバック窓口として機能しているため、新しい仕組みを作らず
// ここへの導線をポップアップのCTAにする(id直書きなので、このProjectを
// 削除・作り直す場合はここも更新すること)。
const FEEDBACK_PROJECT_ID = "p-7fa5c3de85f5";

// サイトの説明と「まだ開発中」であることを、初めて訪れたブラウザにだけ
// 一度見せるポップアップ。ログイン状態やユーザーとは無関係に「この端末で
// 見たかどうか」だけを判定したいので、DBではなくlocalStorageに素朴な
// フラグを持たせるだけにしている(サーバー往復も不要)。
export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回訪問判定はlocalStorage(クライアント専用)でしかできない
      setOpen(true);
    }
  }, []);

  function close() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Draftlyへようこそ"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5 shadow-[0_8px_24px_var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-3xl" aria-hidden>
          🌱
        </p>
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]">
          はじめまして、Draftlyへようこそ
        </h2>
        <p className="mb-3 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          Draftlyは、思いついたアイデアや作りかけのプロダクトを、完成を待たずに育てながら見せていく場所です。作っている過程そのものをタイムラインで発信して、反応をもらいながら形にしていけます。
        </p>
        <p className="mb-4 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          まだ開発中のプロトタイプなので至らない点も多いと思いますが、よければ触ってみた感想や気になったところを教えてもらえると嬉しいです🙏
        </p>
        <div className="flex flex-col items-center gap-2">
          {/* 一番のコンバージョン起点にしたいので、投稿導線を主CTAにする
              (以前は「感想を伝えに行く」が主CTAだったが、閲覧だけで離脱する
              訪問者が多かったための変更)。ComposerFab.tsxと同じ理由で、
              既にホームにいる場合は同一ページ内のハッシュ遷移だけでは
              PostComposerToggle.tsxのマウント時ハッシュ判定が効かないため、
              composer-store.tsを直接叩く。他ページからならリンクの遷移先の
              マウント時ハッシュ判定に任せられる。 */}
          {pathname === "/" ? (
            <button
              type="button"
              onClick={() => {
                openComposer();
                close();
                requestAnimationFrame(() => {
                  document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
              }}
              className="w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-center text-[14px] font-medium text-[var(--accent-ink)] hover:opacity-90"
            >
              まず自分も投稿してみる
            </button>
          ) : (
            <Link
              href="/?composer=1#composer"
              onClick={close}
              className="w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-center text-[14px] font-medium text-[var(--accent-ink)] hover:opacity-90"
            >
              まず自分も投稿してみる
            </Link>
          )}
          <Link
            href={`/work/${FEEDBACK_PROJECT_ID}?tab=comments`}
            onClick={close}
            className="w-full rounded-full border border-[var(--line)] px-4 py-2.5 text-center text-[14px] font-medium text-[var(--ink)] hover:border-[var(--ink-faint)]"
          >
            感想を伝えに行く
          </Link>
          <button type="button" onClick={close} className="text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
            後で
          </button>
        </div>
      </div>
    </div>
  );
}
