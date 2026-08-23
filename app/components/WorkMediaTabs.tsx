"use client";

import { useState, type ReactNode } from "react";
import { HorizontalScroller } from "./HorizontalScroller";

// 作品詳細ページのヒーロー枠用。ProfileTabs.tsxと同じ「中身は呼び出し元が
// 用意したReactNode、このコンポーネント自体はどれを表示するかの切り替え
// だけを持つ」という考え方。表紙画像・GitHub・YouTubeのうち2つ以上が
// 設定されているときだけWorkDetail.tsx側がこれを使う(1つだけならタブ無しで
// そのまま表示する)。
export function WorkMediaTabs({
  tabs,
  initialTabId,
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
  // 通知(NotificationBell.tsx)から「コメントタブを直接開いた状態で作品
  // 詳細に飛びたい」といった要望向け。該当するidが無ければ従来通り先頭に
  // フォールバックする。
  initialTabId?: string;
}) {
  const [active, setActive] = useState(
    initialTabId && tabs.some((t) => t.id === initialTabId) ? initialTabId : tabs[0]?.id,
  );
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <HorizontalScroller
        restrictToHorizontal
        className="mb-4 flex items-center gap-1.5 overflow-x-auto border-b border-[var(--line)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`relative shrink-0 whitespace-nowrap px-3.5 py-2 text-[13px] font-medium transition-colors ${
              activeTab?.id === t.id
                ? "text-[var(--ink)]"
                : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
            }`}
          >
            {t.label}
            {activeTab?.id === t.id && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />
            )}
          </button>
        ))}
      </HorizontalScroller>
      {activeTab?.content}
    </div>
  );
}
