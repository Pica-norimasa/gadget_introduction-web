"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ホーム(フィードそのものが既に画面内にある)では押しても何も
// 起きないため、ホームにいる間だけ非表示にする。
export function FeedNavLink() {
  const pathname = usePathname();
  if (pathname === "/home") return null;

  return (
    <Link
      href="/home#feed"
      className="hidden shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] sm:inline-block"
    >
      ホーム
    </Link>
  );
}
