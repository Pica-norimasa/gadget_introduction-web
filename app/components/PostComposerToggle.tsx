"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Work } from "@/app/lib/mock-data";
import { openComposer, openComposerWithInspiration, useComposerOpen } from "@/app/lib/composer-store";
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
export function PostComposerToggle({
  myProjects,
  isLoggedIn,
}: {
  myProjects: Work[];
  // 投稿は匿名ゲストの荒らし・スパム対策としてログイン必須にした
  // (閲覧・リアクション等は引き続き匿名ゲストのままでも可能)。
  // 未ログインなら投稿フォームの代わりにログイン導線を出す。
  isLoggedIn: boolean;
}) {
  const expanded = useComposerOpen();

  useEffect(() => {
    if (window.location.hash === "#composer") openComposer();

    // 作品詳細ページの「これにインスパイアされて投稿する」から
    // ?inspiredById=&inspiredByTitle=付きで遷移してきた場合、その
    // インスパイア元を保持したままコンポーザーを開く。ハッシュと同じ
    // 理由(next/linkの同一ページ内遷移はhashchangeを発火しない)で
    // マウント時に直接window.location.searchを見て判定する。
    const params = new URLSearchParams(window.location.search);
    const inspiredById = params.get("inspiredById");
    const inspiredByTitle = params.get("inspiredByTitle");
    const initialBody = params.get("initialBody");
    if (inspiredById && inspiredByTitle) {
      openComposerWithInspiration({ id: inspiredById, title: inspiredByTitle, initialBody: initialBody ?? undefined });
      params.delete("inspiredById");
      params.delete("inspiredByTitle");
      params.delete("initialBody");
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
      );
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div id="composer" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-6 sm:px-6">
        <Link
          href="/login"
          className="flex w-full items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-3 text-left text-[15px] text-[var(--ink-faint)] transition-colors hover:border-[var(--accent)]"
        >
          <span aria-hidden>✎</span>
          投稿するにはログインが必要です
        </Link>
      </div>
    );
  }

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
