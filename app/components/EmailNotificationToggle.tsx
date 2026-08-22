"use client";

import { useState } from "react";
import { updateEmailNotificationsEnabled } from "@/app/lib/session-actions";

// LikeButton.tsxと同じ、ローカルstateで楽観トグルしてから裏でServer Action
// を呼ぶだけの最小構成。
export function EmailNotificationToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);

  function handleClick() {
    const next = !enabled;
    setEnabled(next);
    void updateEmailNotificationsEnabled(next);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
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
  );
}
