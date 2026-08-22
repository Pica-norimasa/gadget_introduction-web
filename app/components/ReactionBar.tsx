"use client";

import { useState } from "react";
import { REACTION_META, type ReactionKey, type Work } from "@/app/lib/mock-data";
import { toggleReaction } from "@/app/lib/reaction-actions";

export function ReactionBar({
  workId,
  reactions,
  myReactions,
  variant = "card",
}: {
  workId: string;
  reactions: Work["reactions"];
  // このProjectに対してゲストユーザーが既に押しているリアクション種別(DBから)
  myReactions: ReactionKey[];
  // "card" = 通常のフィードカード内(テーマ変数に追従)
  // "dark" = 没入ビューアの黒スクリム上(常に明色固定)
  variant?: "card" | "dark";
}) {
  const initiallyActive = new Set(myReactions);
  const [toggled, setToggled] = useState<Partial<Record<ReactionKey, boolean>>>({});

  function toggle(key: ReactionKey) {
    setToggled((prev) => ({ ...prev, [key]: !(prev[key] ?? initiallyActive.has(key)) }));
    void toggleReaction(workId, key);
  }

  return (
    <div className="flex flex-wrap gap-1">
      {REACTION_META.map(({ key, icon, label }) => {
        // reactions[key]は既にDB由来の実カウント(自分の分も含む)なので、
        // 自分の押下分を引いてから現在のトグル状態を足し戻す(二重カウント防止)。
        const active = toggled[key] ?? initiallyActive.has(key);
        const baseCount = reactions[key] - (initiallyActive.has(key) ? 1 : 0);
        const count = baseCount + (active ? 1 : 0);
        return (
          <button
            key={`${workId}-${key}`}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => toggle(key)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[11px] transition-all active:scale-90 ${
              variant === "dark"
                ? active
                  ? "border-white bg-white/90 text-black"
                  : "border-white/40 bg-black/25 text-white backdrop-blur-sm hover:border-white/70"
                : active
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
            }`}
          >
            <span aria-hidden>{icon}</span>
            {count}
          </button>
        );
      })}
    </div>
  );
}
