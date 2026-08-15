"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Platform, Work } from "@/app/lib/mock-data";
import { PLATFORM_META, PLATFORM_ORDER } from "@/app/lib/platform-meta";
import { WorkCard } from "./WorkCard";

type Tab = "trend" | "new" | "recommend";

const TABS: { id: Tab; label: string }[] = [
  { id: "trend", label: "急上昇" },
  { id: "new", label: "新着" },
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

export function FeedSection({ works }: { works: Work[] }) {
  const [tab, setTab] = useState<Tab>("trend");
  const [platformFilter, setPlatformFilter] = useState<Set<Platform>>(new Set());
  const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
    // recommend: a stand-in for personalization — favors variety of small creators
    return copy.sort((a, b) => a.followers - b.followers);
  }, [tab, works]);

  const visible = useMemo(() => {
    if (platformFilter.size === 0) return sorted;
    return sorted.filter((w) => w.platforms.some((p) => platformFilter.has(p)));
  }, [sorted, platformFilter]);

  // モックデータは有限なので、無限スクロールらしさを出すために
  // シャッフルした複製を繰り返し継ぎ足す(実プロダクトではページングAPIに置き換える)。
  const feed = useMemo(() => {
    if (visible.length === 0) return [];
    const list: Work[] = [];
    while (list.length < MAX_ITEMS) {
      list.push(...shuffled(visible));
    }
    return list.slice(0, MAX_ITEMS);
  }, [visible]);

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
              return <WorkCard key={`${w.id}-${i}`} work={w} showAnchor={isFirst} />;
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
