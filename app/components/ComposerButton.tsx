"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openComposer } from "@/app/lib/composer-store";

const CLASS_NAME =
  "shrink-0 whitespace-nowrap rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:opacity-90";

// ホームにいる間は、composer-store.tsを直接叩いて投稿フォームを開く
// (同一ページ内のハッシュ遷移はnext/linkのscrollIntoView頼みで
// hashchangeが発火せず、ハッシュ監視だけでは開けないため)。
// 他のページにいる間は通常のLinkとして/#composerへ遷移し、
// PostComposerToggle.tsxのマウント時ハッシュ判定に任せる。
export function ComposerButton() {
  const pathname = usePathname();

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
        className={CLASS_NAME}
      >
        投稿する
      </button>
    );
  }

  return (
    <Link href="/#composer" className={CLASS_NAME}>
      投稿する
    </Link>
  );
}
