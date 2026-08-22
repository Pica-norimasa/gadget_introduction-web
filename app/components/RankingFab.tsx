"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CLASS_NAME =
  "fixed bottom-24 right-6 z-40 grid h-12 w-12 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-raised)] text-xl shadow-lg shadow-[var(--shadow)] transition-transform hover:scale-105 active:scale-95 lg:hidden";

// ホームではMobileSidebarDrawerが同じ位置に「ランキング・おすすめ」ボタンを
// 出しているため二重表示を避ける。詳細ページなどサイドバーが無い画面では、
// 以前の右下固定導線に近い形でランキングページへ遷移させる。
export function RankingFab() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Link href="/ranking" aria-label="ランキングを見る" title="ランキング" className={CLASS_NAME}>
      🏆
    </Link>
  );
}
