"use client";

import { useMemo, useState } from "react";
import type { Work } from "@/app/lib/mock-data";
import { WorkCard } from "./WorkCard";

type Tab = "trend" | "new" | "recommend";

const TABS: { id: Tab; label: string }[] = [
  { id: "trend", label: "急上昇" },
  { id: "new", label: "新着" },
  { id: "recommend", label: "あなたへ" },
];

export function FeedSection({ works }: { works: Work[] }) {
  const [tab, setTab] = useState<Tab>("trend");

  const sorted = useMemo(() => {
    const copy = [...works];
    if (tab === "trend") return copy.sort((a, b) => b.trendScore - a.trendScore);
    if (tab === "new") return copy.sort((a, b) => a.daysAgo - b.daysAgo);
    // recommend: a stand-in for personalization — favors variety of small creators
    return copy.sort((a, b) => a.followers - b.followers);
  }, [tab, works]);

  return (
    <section id="feed" className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-1 border-b border-[var(--line)]">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((w) => (
          <WorkCard key={w.id} work={w} />
        ))}
      </div>
    </section>
  );
}
