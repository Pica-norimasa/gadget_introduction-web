"use client";

import { useState } from "react";
import type { Work } from "@/app/lib/mock-data";

type ReactionKey = keyof Work["reactions"];

const REACTION_META: { key: ReactionKey; icon: string; label: string }[] = [
  { key: "interesting", icon: "😲", label: "面白い" },
  { key: "useful", icon: "🛠️", label: "便利" },
  { key: "idea", icon: "💡", label: "発想◎" },
  { key: "wantToTry", icon: "🙋", label: "使ってみたい" },
];

export function ReactionBar({ workId, reactions }: { workId: string; reactions: Work["reactions"] }) {
  const [toggled, setToggled] = useState<Partial<Record<ReactionKey, boolean>>>({});

  function toggle(key: ReactionKey) {
    setToggled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex flex-wrap gap-1">
      {REACTION_META.map(({ key, icon, label }) => {
        const active = !!toggled[key];
        const count = reactions[key] + (active ? 1 : 0);
        return (
          <button
            key={`${workId}-${key}`}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => toggle(key)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[11px] transition-all active:scale-90 ${
              active
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
