"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { REACTION_META } from "@/app/lib/mock-data";
import { formatRelativeHours } from "@/app/lib/format";
import type { NotificationView } from "@/app/lib/queries";
import { markNotificationsRead } from "@/app/lib/notification-actions";

function describe(n: NotificationView): string {
  if (n.type === "follow") return `${n.actorName}さんにフォローされました`;
  if (n.type === "comment") return `${n.actorName}さんが「${n.projectTitle}」にコメントしました`;
  const meta = REACTION_META.find((m) => m.key === n.reactionType);
  return `${n.actorName}さんが「${n.projectTitle}」に${meta?.icon ?? ""}リアクションしました`;
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationView[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [localUnread, setLocalUnread] = useState(unreadCount);
  const ref = useRef<HTMLDivElement>(null);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && localUnread > 0) {
      setLocalUnread(0);
      void markNotificationsRead();
    }
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="通知"
        onClick={toggle}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)]"
      >
        🔔
        {localUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-[var(--accent-ink)]">
            {localUnread > 9 ? "9+" : localUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 max-h-96 w-80 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-2 shadow-[0_8px_24px_var(--shadow)]">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-[13px] text-[var(--ink-faint)]">通知はまだありません</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {notifications.map((n) => {
                const row = (
                  <div
                    className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed text-[var(--ink)] ${
                      n.read ? "" : "bg-[var(--accent-soft)]"
                    }`}
                  >
                    <p>{describe(n)}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--ink-faint)]">
                      {formatRelativeHours(n.hoursAgo)}
                    </p>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.projectId ? (
                      <Link
                        href={`/work/${n.projectId}`}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl hover:bg-[var(--bg-sunken)]"
                      >
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
