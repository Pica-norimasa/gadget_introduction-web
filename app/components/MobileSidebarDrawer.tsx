"use client";

import { useEffect, useState, type ReactNode } from "react";

// lg未満でのサイドバー(ランキング・おすすめの作者等)へのアクセス手段。
// フィードが無限スクロールで際限なく伸びるため、下にそのまま置いても
// アンカーリンクでジャンプさせても実質たどり着けない(前はdetailsで
// その場開閉にしていたが、Xの右メニューのようなスライドインの方が
// 見た目・操作感として分かりやすいという要望を受けて置き換えた)。
// トリガーボタンはComposerFab(✏️、bottom-6 right-6)の真上に固定表示する。
export function MobileSidebarDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // 開いている間は背後のページ本体がスクロールしないようにする。
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="ランキング・おすすめを見る"
        title="ランキング・おすすめ"
        className="fixed bottom-24 right-6 z-40 grid h-12 w-12 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-raised)] text-xl shadow-lg shadow-[var(--shadow)] transition-transform hover:scale-105 active:scale-95 lg:hidden"
      >
        🏆
      </button>

      {/* 背景の暗幕。open=falseの間もDOMには残し(トランジションのため)、
          pointer-events-noneでクリックを無効化する。 */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="ランキング・おすすめ"
        onClick={(e) => {
          // ランキング等のリンクをタップして遷移・ジャンプする際は、
          // 選んだ後もドロワーが開いたままだと結果が見えないため閉じる。
          if ((e.target as HTMLElement).closest("a")) {
            setOpen(false);
          }
        }}
        className={`fixed inset-y-0 right-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-[var(--bg)] p-4 shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
            ランキング・おすすめ
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="閉じる"
            className="grid h-8 w-8 place-items-center rounded-full text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
