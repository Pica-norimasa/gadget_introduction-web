"use client";

import { useRouter } from "next/navigation";

// Xなど外部リンクから直接この作品ページに着地した場合はタブ内に戻り先が
// 無いため、ホームにフォールバックする。それ以外(サイト内リンクで
// 遷移してきた場合)は素直にブラウザ履歴を1つ戻す。
export function BackButton({ fallbackHref, className }: { fallbackHref: string; className?: string }) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      ← 戻る
    </button>
  );
}
