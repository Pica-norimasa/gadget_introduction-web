"use client";

import { useState } from "react";
import { setAiCommentsEnabled } from "@/app/lib/project-actions";

// EmailNotificationToggle.tsxと同じ、ローカルstateで楽観トグルしてから
// 裏でServer Actionを呼ぶだけの最小構成。
export function AiCommentsToggle({
  projectId,
  initialEnabled,
}: {
  projectId: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);

  function handleClick() {
    const next = !enabled;
    setEnabled(next);
    void setAiCommentsEnabled(projectId, next);
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2">
      <div>
        <p className="text-[13px] font-medium text-[var(--ink)]">Draftly AIの自動応援コメント</p>
        <p className="text-[11.5px] text-[var(--ink-faint)]">
          制作タイムラインの更新に、Draftly AIが自動でコメントするかどうか
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Draftly AIの自動応援コメント"
        onClick={handleClick}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-[var(--accent)]" : "bg-[var(--bg-sunken)]"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
