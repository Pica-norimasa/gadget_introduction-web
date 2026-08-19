"use client";

import { useState, type ReactNode } from "react";

// 作品詳細ページのヒーロー枠用。ProfileTabs.tsxと同じ「中身は呼び出し元が
// 用意したReactNode、このコンポーネント自体はどれを表示するかの切り替え
// だけを持つ」という考え方。表紙画像・GitHub・YouTubeのうち2つ以上が
// 設定されているときだけWorkDetail.tsx側がこれを使う(1つだけならタブ無しで
// そのまま表示する)。
export function WorkMediaTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-2 flex items-center gap-1 border-b border-[var(--line)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`relative px-3 py-1.5 text-[13px] font-medium transition-colors ${
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
      </div>
      {activeTab?.content}
    </div>
  );
}
