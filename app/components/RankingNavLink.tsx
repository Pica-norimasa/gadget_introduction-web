"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CLASS_NAME =
  "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)] sm:h-auto sm:w-auto sm:border-0 sm:px-3 sm:py-2 sm:text-sm";

// ホームにいる間はnext/linkの同一ページ内ハッシュ遷移がscrollIntoViewを
// 頼りにしてもhashchangeが発火せず反応しないため(ComposerButton.tsxと
// 同じ理由)、直接scrollIntoViewを呼ぶ。他のページでは通常のLinkのまま
// /#rankingへ遷移する。
export function RankingNavLink() {
  const pathname = usePathname();

  if (pathname === "/") {
    return (
      <button
        type="button"
        onClick={() => {
          document.getElementById("ranking")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        className={CLASS_NAME}
        aria-label="ランキング"
        title="ランキング"
      >
        <span aria-hidden className="sm:hidden">↗</span>
        <span className="hidden sm:inline">ランキング</span>
      </button>
    );
  }

  return (
    <Link href="/#ranking" className={CLASS_NAME} aria-label="ランキング" title="ランキング">
      <span aria-hidden className="sm:hidden">↗</span>
      <span className="hidden sm:inline">ランキング</span>
    </Link>
  );
}
