"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { REACTION_META } from "@/app/lib/mock-data";
import { formatRelativeHours } from "@/app/lib/format";
import type { NotificationView } from "@/app/lib/queries";
import { markNotificationsRead } from "@/app/lib/notification-actions";

// "Aさん" / "Aさん、Bさん" / "Aさん、Bさん他5人" のように、まとめた
// 通知の主語部分を組み立てる。各名前は個別にプロフィールへリンクする
// (「他N人」の部分だけはリンクしようがないのでプレーンテキストのまま)。
function ActorLabel({ n, onNavigate }: { n: NotificationView; onNavigate: () => void }) {
  const [first, second] = n.actorNames;
  const nameLink = (name: string) => (
    <Link
      key={name}
      href={`/u/${encodeURIComponent(name)}`}
      onClick={onNavigate}
      className="font-medium text-[var(--ink)] hover:underline"
    >
      {name}さん
    </Link>
  );
  if (n.actorCount <= 1) return nameLink(first);
  if (n.actorCount === 2) return (
    <>
      {nameLink(first)}、{nameLink(second)}
    </>
  );
  return (
    <>
      {nameLink(first)}、{nameLink(second)}他{n.actorCount - 2}人
    </>
  );
}

// 通知の行全体を対象Projectへのリンクにしていたところに作者名リンクを
// 混ぜると<a>のネスト(不正なHTML)になるため、「主語(誰が)」と
// 「残りの文(何をしたか、対象Projectへのリンクを含む)」を兄弟要素として
// 分けている。
function NotificationMessage({ n, onNavigate }: { n: NotificationView; onNavigate: () => void }) {
  const actor = <ActorLabel n={n} onNavigate={onNavigate} />;

  if (n.type === "follow") {
    return <>{actor}にフォローされました</>;
  }

  const suffix =
    n.type === "comment"
      ? `が「${n.projectTitle}」にコメントしました`
      : n.type === "repost"
        ? `が「${n.projectTitle}」をリポストしました`
        : `が「${n.projectTitle}」に${REACTION_META.find((m) => m.key === n.reactionType)?.icon ?? ""}リアクションしました`;

  return (
    <>
      {actor}
      {n.projectId ? (
        <Link href={`/work/${n.projectId}`} onClick={onNavigate} className="hover:underline">
          {suffix}
        </Link>
      ) : (
        suffix
      )}
    </>
  );
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
              {notifications.map((n) => (
                <li key={n.id}>
                  <div
                    className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed text-[var(--ink)] ${
                      n.read ? "" : "bg-[var(--accent-soft)]"
                    }`}
                  >
                    <p>
                      <NotificationMessage n={n} onNavigate={() => setOpen(false)} />
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--ink-faint)]">
                      {formatRelativeHours(n.hoursAgo)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
