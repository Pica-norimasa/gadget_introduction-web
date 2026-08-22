"use client";

import { useState, type ReactNode } from "react";
import { HorizontalScroller } from "./HorizontalScroller";

type TabId = "posted" | "reposted" | "blocked" | "murmurs" | "following" | "bookmarked";

// FeedSectionの新着/急上昇/あなたへタブと同じ、下線付きのタブUIを流用。
// 各タブの中身は既にサーバー側でレンダリング済みのReactNode(WorkCardの
// グリッドやMutedBlockedList)を受け取るだけで、このコンポーネント自体は
// 「どれを表示するか」の切り替えしか持たない。つぶやきタブは一番左に
// 固定したいため、先頭に置く。
export function ProfileTabs({
  postedLabel,
  repostedLabel,
  murmursLabel,
  followingLabel,
  bookmarkedLabel,
  showBlockedTab,
  showBookmarksTab,
  postedContent,
  repostedContent,
  blockedContent,
  murmursContent,
  followingContent,
  bookmarkedContent,
}: {
  postedLabel: string;
  repostedLabel: string;
  murmursLabel: string;
  followingLabel: string;
  bookmarkedLabel: string;
  showBlockedTab: boolean;
  // ブックマークは自分だけの非公開の保存なので、他人のプロフィールを
  // 見ているときはタブごと出さない(showBlockedTabと同じ理由)。
  showBookmarksTab: boolean;
  postedContent: ReactNode;
  repostedContent: ReactNode;
  blockedContent: ReactNode;
  murmursContent: ReactNode;
  followingContent: ReactNode;
  bookmarkedContent: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("posted");

  const tabs: { id: TabId; label: string }[] = [
    { id: "murmurs", label: murmursLabel },
    { id: "posted", label: postedLabel },
    { id: "reposted", label: repostedLabel },
    { id: "following", label: followingLabel },
    ...(showBookmarksTab ? [{ id: "bookmarked" as const, label: bookmarkedLabel }] : []),
    ...(showBlockedTab ? [{ id: "blocked" as const, label: "ブロックユーザー" }] : []),
  ];

  return (
    <div>
      <HorizontalScroller
        restrictToHorizontal
        className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-[var(--line)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative shrink-0 whitespace-nowrap px-2.5 py-2 text-[13px] font-medium transition-colors sm:px-3 sm:text-sm ${
              tab === t.id ? "text-[var(--ink)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />}
          </button>
        ))}
      </HorizontalScroller>

      {tab === "posted" && postedContent}
      {tab === "reposted" && repostedContent}
      {tab === "blocked" && showBlockedTab && blockedContent}
      {tab === "murmurs" && murmursContent}
      {tab === "following" && followingContent}
      {tab === "bookmarked" && showBookmarksTab && bookmarkedContent}
    </div>
  );
}
