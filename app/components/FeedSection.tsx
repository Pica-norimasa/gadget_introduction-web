"use client";

import { useMemo, useState } from "react";
import type { Platform, Work } from "@/app/lib/mock-data";
import { PLATFORM_META, PLATFORM_ORDER } from "@/app/lib/platform-meta";
import { WorkCard } from "./WorkCard";

type Tab = "trend" | "new" | "recommend";

const TABS: { id: Tab; label: string }[] = [
  { id: "trend", label: "急上昇" },
  { id: "new", label: "新着" },
  { id: "recommend", label: "あなたへ" },
];

export function FeedSection({ works }: { works: Work[] }) {
  const [tab, setTab] = useState<Tab>("trend");
  const [platformFilter, setPlatformFilter] = useState<Set<Platform>>(new Set());

  function togglePlatform(p: Platform) {
    setPlatformFilter((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
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

  return (
    <section id="feed" className="scroll-mt-24">
      <div className="mb-3 flex items-center gap-1 border-b border-[var(--line)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
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
            onClick={() => setPlatformFilter(new Set())}
            className="ml-1 text-[12px] text-[var(--ink-faint)] underline decoration-dotted hover:text-[var(--ink-soft)]"
          >
            条件をクリア
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-faint)]">
          この条件に合う作品はまだありません
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </div>
      )}
    </section>
  );
}
