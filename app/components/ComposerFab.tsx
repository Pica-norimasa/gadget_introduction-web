"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openComposer } from "@/app/lib/composer-store";

const CLASS_NAME =
  "fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--ink)] text-2xl text-[var(--bg)] shadow-lg shadow-[var(--shadow)] transition-transform hover:scale-105 active:scale-95";

// SiteHeader経由で全ページに表示される、投稿の唯一の入口(旧DiceButtonの
// 位置を引き継いだ、X/Gmail的な右下固定ボタン)。ホームにいる間は
// composer-store.tsを直接叩いて投稿フォームを開く(同一ページ内の
// ハッシュ遷移はnext/linkのscrollIntoView頼みでhashchangeが発火せず、
// ハッシュ監視だけでは開けないため)。他のページでは/?composer=1#composerへ遷移し、
// PostComposerToggle.tsxのマウント時クエリ/ハッシュ判定に任せる。
export function ComposerFab() {
  const pathname = usePathname();

  if (pathname.startsWith("/u/")) return null;

  if (pathname === "/") {
    return (
      <button
        type="button"
        onClick={() => {
          openComposer();
          requestAnimationFrame(() => {
            document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }}
        aria-label="投稿する"
        title="投稿する"
        className={CLASS_NAME}
      >
        ✏️
      </button>
    );
  }

  return (
    <Link href="/?composer=1#composer" aria-label="投稿する" title="投稿する" className={CLASS_NAME}>
      ✏️
    </Link>
  );
}
