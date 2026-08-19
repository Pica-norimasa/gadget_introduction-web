"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CLASS_NAME =
  "hidden rounded-full px-3 py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-block";

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
      >
        ランキング
      </button>
    );
  }

  return (
    <Link href="/#ranking" className={CLASS_NAME}>
      ランキング
    </Link>
  );
}
