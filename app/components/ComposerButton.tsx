"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openComposer } from "@/app/lib/composer-store";

const CLASS_NAME =
  "shrink-0 whitespace-nowrap rounded-full bg-[var(--ink)] px-3 py-2 text-sm font-medium text-[var(--bg)] hover:opacity-90 sm:px-4";

// 一番幅の厳しいモバイルでは「投稿する」の4文字でもヘッダーからはみ出す
// ことがあったため、狭い画面だけ「投稿」の2文字に短縮する(sm以上は
// フルの文言に戻す)。
function Label() {
  return (
    <>
      <span className="sm:hidden">投稿</span>
      <span className="hidden sm:inline">投稿する</span>
    </>
  );
}

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
        <Label />
      </button>
    );
  }

  return (
    <Link href="/#composer" className={CLASS_NAME}>
      <Label />
    </Link>
  );
}
