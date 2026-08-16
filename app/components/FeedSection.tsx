"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Platform, Post, ReactionKey, Work } from "@/app/lib/mock-data";
import type { RepostView } from "@/app/lib/queries";
import { PLATFORM_META, PLATFORM_ORDER } from "@/app/lib/platform-meta";
import { useFollowedAuthors } from "@/app/lib/follow-store";
import { WorkCard } from "./WorkCard";

type Tab = "trend" | "new" | "recommend";

const TABS: { id: Tab; label: string }[] = [
  { id: "new", label: "新着" },
  { id: "trend", label: "急上昇" },
  { id: "recommend", label: "あなたへ" },
];

const BATCH_SIZE = 6;
const MAX_ITEMS = 60;

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 「あなたへ」タブの簡易パーソナライズ。本物のレコメンドAIの代わりに、
// 手元にある3つのシグナル(フォロー中の作者・過去にリアクションした作品の
// カテゴリ/ツール・フォロー中の"誰か"がリポストした作品)から素点を作る。
// リポストのシグナルは、作品自体の作者をフォローしていなくても、
// フォロー中の人が「これは良い」と拡散したという間接的な推薦になる
// (直接フォローの+100ほどではないが、カテゴリ/ツール一致よりは強い、
// という重み付け)。どのシグナルも無い(未フォロー・未リアクション・
// リポストも無い)ユーザーには、従来通り小さな作者を少し優遇して発見の
// 余地を残す。
function personalizedScore(
  w: Work,
  followedAuthors: ReadonlySet<string>,
  affinity: { categories: Set<string>; tools: Set<string> },
  repostedByFollowed: ReadonlySet<string>,
): number {
  let score = 0;
  if (followedAuthors.has(w.author)) score += 100;
  if (repostedByFollowed.has(w.id)) score += 60;
  if (affinity.categories.has(w.category)) score += 20;
  if (w.tool && affinity.tools.has(w.tool)) score += 10;
  score += Math.max(0, 30 - w.followers) * 0.5;
  return score;
}

export function FeedSection({
  works,
  posts,
  myReactions,
  currentUserId,
  reposts,
}: {
  works: Work[];
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
  currentUserId: string | null;
  reposts: RepostView[];
}) {
  const [tab, setTab] = useState<Tab>("new");
  const [platformFilter, setPlatformFilter] = useState<Set<Platform>>(new Set());
  const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const followedAuthors = useFollowedAuthors();

  // Math.random()を使うshuffleは、サーバー側の初回レンダリングと
  // クライアントのハイドレーション時とで結果が食い違い、ハイドレーション
  // 不整合を起こす。マウント前は決定的な(シャッフルしない)順序で揃え、
  // マウント後にだけシャッフルを効かせる。
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 上記の理由でマウント後にのみtrueにする必要がある
    setMounted(true);
  }, []);

  function togglePlatform(p: Platform) {
    setPlatformFilter((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
    setLoadedCount(BATCH_SIZE);
  }

  const sorted = useMemo(() => {
    const copy = [...works];
    if (tab === "trend") return copy.sort((a, b) => b.trendScore - a.trendScore);
    if (tab === "new") return copy.sort((a, b) => a.daysAgo - b.daysAgo);

    const reactedWorks = works.filter((w) => (myReactions[w.id]?.length ?? 0) > 0);
    const affinity = {
      categories: new Set(reactedWorks.map((w) => w.category)),
      tools: new Set(reactedWorks.map((w) => w.tool).filter((t): t is Exclude<Work["tool"], null> => t !== null)),
    };
    const repostedByFollowed = new Set(
      reposts.filter((r) => followedAuthors.has(r.userName)).map((r) => r.projectId),
    );
    return copy.sort(
      (a, b) =>
        personalizedScore(b, followedAuthors, affinity, repostedByFollowed) -
        personalizedScore(a, followedAuthors, affinity, repostedByFollowed),
    );
  }, [tab, works, myReactions, followedAuthors, reposts]);

  const visible = useMemo(() => {
    if (platformFilter.size === 0) return sorted;
    return sorted.filter((w) => w.platforms.some((p) => platformFilter.has(p)));
  }, [sorted, platformFilter]);

  // 1周目はタブのソート順(急上昇/新着/あなたへ)をそのまま見せる。
  // 件数が有限なので無限スクロールらしさを出すために2周目以降だけ
  // シャッフルした複製を継ぎ足す(実プロダクトではページングAPIに置き換える)。
  const feed = useMemo(() => {
    if (visible.length === 0) return [];
    const list: Work[] = [...visible];
    while (list.length < MAX_ITEMS) {
      list.push(...(mounted ? shuffled(visible) : visible));
    }
    return list.slice(0, MAX_ITEMS);
  }, [visible, mounted]);

  function selectTab(t: Tab) {
    setTab(t);
    setLoadedCount(BATCH_SIZE);
  }

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadedCount((c) => Math.min(c + BATCH_SIZE, MAX_ITEMS));
        }
      },
      // rootMarginを大きくしすぎると、1バッチ分のカードを追加した後も
      // sentinelが判定範囲に留まり続けてしまい、次のexit→enterが起きず
      // 無限スクロールが1回で止まる。控えめな値にして毎回exitさせる。
      { rootMargin: "150px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shown = feed.slice(0, loadedCount);
  const seenIds = new Set<string>();

  return (
    <section id="feed" className="scroll-mt-24">
      <div className="mb-3 flex items-center gap-1 border-b border-[var(--line)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`relative px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "text-[var(--ink)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />
            )}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[12px] text-[var(--ink-faint)]">対応環境</span>
        {PLATFORM_ORDER.map((p) => {
          const active = platformFilter.has(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
              }`}
            >
              <span aria-hidden>{PLATFORM_META[p].icon}</span>
              {PLATFORM_META[p].label}
            </button>
          );
        })}
        {platformFilter.size > 0 && (
          <button
            type="button"
            onClick={() => {
              setPlatformFilter(new Set());
              setLoadedCount(BATCH_SIZE);
            }}
            className="ml-1 text-[12px] text-[var(--ink-faint)] underline decoration-dotted hover:text-[var(--ink-soft)]"
          >
            条件をクリア
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-faint)]">
          この条件に合う作品はまだありません
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((w, i) => {
              const isFirst = !seenIds.has(w.id);
              seenIds.add(w.id);
              return (
                <WorkCard
                  key={`${w.id}-${i}`}
                  work={w}
                  posts={posts}
                  myReactions={myReactions}
                  currentUserId={currentUserId}
                  showAnchor={isFirst}
                />
              );
            })}
          </div>

          <div ref={sentinelRef} className="h-1" />

          {loadedCount < MAX_ITEMS ? (
            <div className="flex justify-center pt-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)]" />
            </div>
          ) : (
            <p className="pt-8 text-center text-[12px] text-[var(--ink-faint)]">
              また明日、新しい発見が待っています
            </p>
          )}
        </>
      )}
    </section>
  );
}
