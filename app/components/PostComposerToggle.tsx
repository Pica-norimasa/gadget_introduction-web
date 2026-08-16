"use client";

import { useEffect } from "react";
import type { Work } from "@/app/lib/mock-data";
import { openComposer, useComposerOpen } from "@/app/lib/composer-store";
import { PostComposer } from "./PostComposer";

// トップページを開いた瞬間から作品一覧を見せたいので、投稿フォームは
// 常時表示せず、折りたたんだ状態のバーだけを最初に見せる。展開後は
// (投稿してもフォームが消えず継続して使えるXの挙動に合わせて)畳み直す
// UIは用意していない。
//
// 「開いているか」はcomposer-store.tsが単一の状態源。他ページから
// ヘッダーの「投稿する」(href="/#composer")で来た場合は、マウント時に
// ハッシュを見て開く。既にホームにいる場合はComposerButton.tsxが
// このストアを直接呼ぶ(同一ページ内のハッシュ遷移はnext/linkが
// hashchangeを発火しないため、ハッシュ監視だけには頼れない)。
export function PostComposerToggle({ myProjects }: { myProjects: Work[] }) {
  const expanded = useComposerOpen();

  useEffect(() => {
    if (window.location.hash === "#composer") openComposer();
  }, []);

  if (expanded) {
    return <PostComposer myProjects={myProjects} />;
  }

  return (
    <div id="composer" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-6 sm:px-6">
      <button
        type="button"
        onClick={openComposer}
        className="flex w-full items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-3 text-left text-[15px] text-[var(--ink-faint)] transition-colors hover:border-[var(--accent)]"
      >
        <span aria-hidden>✎</span>
        思いついたこと、気軽に投稿する
      </button>
    </div>
  );
}
