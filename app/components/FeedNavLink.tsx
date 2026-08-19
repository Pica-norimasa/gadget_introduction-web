"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// トップページ(フィードそのものが既に画面内にある)では押しても何も
// 起きないため、トップページにいる間だけ非表示にする。
export function FeedNavLink() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Link
      href="/#feed"
      className="hidden shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-block"
    >
      ホーム
    </Link>
  );
}
