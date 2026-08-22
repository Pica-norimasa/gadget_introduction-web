import Link from "next/link";

const CLASS_NAME =
  "inline-flex h-9 shrink-0 items-center rounded-full border border-[var(--line)] px-2.5 text-[12px] text-[var(--ink-soft)] hover:text-[var(--ink)] sm:h-auto sm:border-0 sm:px-3 sm:py-2 sm:text-sm";

// 以前はモバイルだけ「↗」アイコンでホーム内ランキングへスクロールして
// いたが、意味が伝わりづらく、対象アンカーが無い状態では無反応に見えた。
// 独立したランキングページへ遷移する通常リンクにして、常に動作を明確にする。
export function RankingNavLink() {
  return (
    <Link href="/ranking" className={CLASS_NAME} aria-label="ランキング" title="ランキング">
      <span>ランキング</span>
    </Link>
  );
}
