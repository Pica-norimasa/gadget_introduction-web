"use client";

import { useState, type ReactNode } from "react";

type TabId = "posted" | "reposted" | "blocked";

// FeedSectionの新着/急上昇/あなたへタブと同じ、下線付きのタブUIを流用。
// 各タブの中身は既にサーバー側でレンダリング済みのReactNode(WorkCardの
// グリッドやMutedBlockedList)を受け取るだけで、このコンポーネント自体は
// 「どれを表示するか」の切り替えしか持たない。
export function ProfileTabs({
  postedLabel,
  repostedLabel,
  showBlockedTab,
  postedContent,
  repostedContent,
  blockedContent,
}: {
  postedLabel: string;
  repostedLabel: string;
  showBlockedTab: boolean;
  postedContent: ReactNode;
  repostedContent: ReactNode;
  blockedContent: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("posted");

  const tabs: { id: TabId; label: string }[] = [
    { id: "posted", label: postedLabel },
    { id: "reposted", label: repostedLabel },
    ...(showBlockedTab ? [{ id: "blocked" as const, label: "ブロックユーザー" }] : []),
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-[var(--line)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "text-[var(--ink)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />}
          </button>
        ))}
      </div>

      {tab === "posted" && postedContent}
      {tab === "reposted" && repostedContent}
      {tab === "blocked" && showBlockedTab && blockedContent}
    </div>
  );
}
