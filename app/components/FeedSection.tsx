"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Platform, Post, ReactionKey, Work } from "@/app/lib/mock-data";
import type { InspirationSignalView, RepostView } from "@/app/lib/queries";
import { PLATFORM_META, PLATFORM_ORDER } from "@/app/lib/platform-meta";
import { useFollowedAuthors } from "@/app/lib/follow-store";
import { WorkCard } from "./WorkCard";

type Tab = "discovery" | "trend" | "new" | "recommend";

const TABS: { id: Tab; label: string }[] = [
  { id: "discovery", label: "おすすめ" },
  { id: "new", label: "新着" },
  { id: "trend", label: "急上昇" },
  { id: "recommend", label: "あなたへ" },
];

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  discovery: "まだ知られていない作品や、掘り出し物を優先して並べます。",
  new: "最近投稿・更新された作品から見ていきます。",
  trend: "反応や閲覧が伸びている作品を優先します。",
  recommend: "フォローやリアクションに近い作品を並べます。",
};

const BATCH_SIZE = 6;

// 「あなたへ」タブの簡易パーソナライズ。本物のレコメンドAIの代わりに、
// 手元にある4つのシグナル(フォロー中の作者・過去にリアクションした作品の
// カテゴリ/ツール・フォロー中の"誰か"がリポストした作品・フォロー中の
// "誰か"がインスパイアされた作品)から素点を作る。リポストのシグナルは、
// 作品自体の作者をフォローしていなくても、フォロー中の人が「これは良い」
// と拡散したという間接的な推薦になる(直接フォローの+100ほどではないが、
// カテゴリ/ツール一致よりは強い、という重み付け)。インスパイアの
// シグナルも同じ重み付けにしている(「拡散した」より「実際に何か作る
// くらい良いと思った」の方が強いとも言えるが、恣意的な差をつけるより
// 同格の「フォロー中の人からの推薦」として揃えた)。両方のシグナルが
// 同時に成立すれば加点は両方乗る。どのシグナルも無い(未フォロー・
// 未リアクション・リポスト/インスパイアも無い)ユーザーには、従来通り
// 小さな作者を少し優遇して発見の余地を残す。
function personalizedScore(
  w: Work,
  followedAuthors: ReadonlySet<string>,
  affinity: { categories: Set<string>; tools: Set<string> },
  repostedByFollowed: ReadonlySet<string>,
  inspiredByFollowed: ReadonlySet<string>,
): number {
  let score = 0;
  if (followedAuthors.has(w.author)) score += 100;
  if (repostedByFollowed.has(w.id)) score += 60;
  if (inspiredByFollowed.has(w.id)) score += 60;
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
  inspirations,
  discoveryWorks,
}: {
  works: Work[];
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
  currentUserId: string | null;
  reposts: RepostView[];
  inspirations: InspirationSignalView[];
  discoveryWorks: Work[];
}) {
  const [tab, setTab] = useState<Tab>("discovery");
  const [platformFilter, setPlatformFilter] = useState<Set<Platform>>(new Set());
  const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const followedAuthors = useFollowedAuthors();

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
    const source = tab === "discovery" ? discoveryWorks : works;
    const copy = [...source];
    if (tab === "discovery") return copy;
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
    const inspiredByFollowed = new Set(
      inspirations.filter((i) => followedAuthors.has(i.userName)).map((i) => i.projectId),
    );
    return copy.sort(
      (a, b) =>
        personalizedScore(b, followedAuthors, affinity, repostedByFollowed, inspiredByFollowed) -
        personalizedScore(a, followedAuthors, affinity, repostedByFollowed, inspiredByFollowed),
    );
  }, [tab, works, discoveryWorks, myReactions, followedAuthors, reposts, inspirations]);

  const visible = useMemo(() => {
    if (platformFilter.size === 0) return sorted;
    return sorted.filter((w) => w.platforms.some((p) => platformFilter.has(p)));
  }, [sorted, platformFilter]);

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
          setLoadedCount((c) => Math.min(c + BATCH_SIZE, visible.length));
        }
      },
      // rootMarginを大きくしすぎると、1バッチ分のカードを追加した後も
      // sentinelが判定範囲に留まり続けてしまい、次のexit→enterが起きず
      // 無限スクロールが1回で止まる。控えめな値にして毎回exitさせる。
      { rootMargin: "150px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible.length]);

  const shown = visible.slice(0, loadedCount);

  return (
    <section>
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
      <p className="mb-4 text-[12px] leading-relaxed text-[var(--ink-faint)]">{TAB_DESCRIPTIONS[tab]}</p>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[12px] text-[var(--ink-faint)]">対応環境</span>
        {PLATFORM_ORDER.map((p) => {
          const active = platformFilter.has(p);
          const { Icon, label } = PLATFORM_META[p];
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
              <Icon className="h-3.5 w-3.5" />
              {label}
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
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-raised)] p-8 text-center">
          <p className="text-sm font-medium text-[var(--ink-soft)]">この条件に合う作品はまだありません</p>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--ink-faint)]">
            対応環境の条件を外すか、つぶやきで「こんな作品ありませんか?」と聞いてみてください。
          </p>
          {platformFilter.size > 0 && (
            <button
              type="button"
              onClick={() => {
                setPlatformFilter(new Set());
                setLoadedCount(BATCH_SIZE);
              }}
              className="mt-4 rounded-full border border-[var(--line)] px-3 py-1.5 text-[12px] text-[var(--ink-soft)] hover:border-[var(--accent)]"
            >
              条件をクリアして見る
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((w) => (
              <WorkCard
                key={w.id}
                work={w}
                posts={posts}
                myReactions={myReactions}
                currentUserId={currentUserId}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="h-1" />

          {loadedCount < visible.length ? (
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
