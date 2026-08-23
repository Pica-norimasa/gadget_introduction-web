"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Work } from "@/app/lib/mock-data";
import { GUEST_POST_LIMIT } from "@/app/lib/guest-limits";
import { openComposer, openComposerWithInspiration, useComposerOpen } from "@/app/lib/composer-store";
import { PostForm } from "./PostForm";

// トップページを開いた瞬間から作品一覧を見せたいので、投稿フォームは
// 常時表示しない。投稿入口は上部の「投稿する」カードと右下FABに集約し、
// 未展開時はスクロール先として必要なアンカーだけを置く。展開後は
// (投稿してもフォームが消えず継続して使えるXの挙動に合わせて)畳み直す
// UIは用意していない。
//
// 「開いているか」はcomposer-store.tsが単一の状態源。他ページから
// ヘッダーの「投稿する」(href="/?composer=1#composer")で来た場合は、
// マウント時にクエリ/ハッシュを見て開く。既にホームにいる場合はComposerButton.tsxが
// このストアを直接呼ぶ(同一ページ内のハッシュ遷移はnext/linkが
// hashchangeを発火しないため、ハッシュ監視だけには頼れない)。
export function PostComposerToggle({
  myProjects,
  isLoggedIn,
  guestPostCount,
}: {
  myProjects: Work[];
  // 投稿は荒らし・スパム対策として原則ログイン必須にしているが、
  // 「試しに使ってみたい」訪問者の摩擦を減らすため、未ログインでも
  // GUEST_POST_LIMIT件までは投稿できる(post-actions.ts参照)。
  isLoggedIn: boolean;
  // ログイン済みの場合は上限が無いので無視される。
  guestPostCount: number;
}) {
  const expanded = useComposerOpen();
  const guestRemaining = GUEST_POST_LIMIT - guestPostCount;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldOpenComposer = window.location.hash === "#composer" || params.get("composer") === "1";
    if (shouldOpenComposer) {
      openComposer();
      requestAnimationFrame(() => {
        document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    // 作品詳細ページの「これにインスパイアされて投稿する」から
    // ?inspiredById=&inspiredByTitle=付きで遷移してきた場合、その
    // インスパイア元を保持したままコンポーザーを開く。ハッシュと同じ
    // 理由(next/linkの同一ページ内遷移はhashchangeを発火しない)で
    // マウント時に直接window.location.searchを見て判定する。
    const inspiredById = params.get("inspiredById");
    const inspiredByTitle = params.get("inspiredByTitle");
    if (inspiredById && inspiredByTitle) {
      openComposerWithInspiration({ id: inspiredById, title: inspiredByTitle });
      params.delete("inspiredById");
      params.delete("inspiredByTitle");
    }

    if (params.get("composer") === "1") {
      params.delete("composer");
    }

    if ((inspiredById && inspiredByTitle) || shouldOpenComposer) {
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
      );
    }
  }, []);

  if (!isLoggedIn && guestRemaining <= 0) {
    return (
      <div id="composer" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-6 sm:px-6">
        <Link
          href="/login"
          className="flex w-full items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-3 text-left text-[15px] text-[var(--ink-faint)] transition-colors hover:border-[var(--accent)]"
        >
          <span aria-hidden>✎</span>
          ゲストの投稿は{GUEST_POST_LIMIT}件までです。続けて投稿するにはログインしてください
        </Link>
      </div>
    );
  }

  // ゲストにも投稿を開放したこと自体が伝わらないと、そのままログイン導線
  // だと勘違いされかねないので、残り件数を常に見える位置に出しておく。
  const guestNotice = !isLoggedIn && (
    <p className="mx-auto max-w-[1180px] px-4 pt-2 text-[12px] text-[var(--ink-faint)] sm:px-6">
      🔓 ログインなしでもあと{guestRemaining}件投稿できます(ログインすると無制限に投稿できます)
    </p>
  );

  if (expanded) {
    return (
      <>
        <PostForm variant="compose" myProjects={myProjects} />
        {guestNotice}
      </>
    );
  }

  return (
    <>
      <div id="composer" className="scroll-mt-24" />
      {guestNotice}
    </>
  );
}
