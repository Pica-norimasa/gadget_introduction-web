"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TickerActivity } from "@/app/lib/queries";
import { formatRelativeHours } from "@/app/lib/format";

const HOLD_MS = 10000;

// ヘッダー直下で、最新の創作活動(制作タイムライン更新・コメント)を
// 1件ずつ見せるティッカー。常時流れっぱなしだと鬱陶しいという指摘を
// 受け、右からシュッと1件入ってきて少し静止し、また次が入ってくる
// 方式にした(globals.cssのticker-item-in参照)。hover中は切り替えを止める。
export function UpdatesTicker({ activity }: { activity: TickerActivity[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (activity.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % activity.length);
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [activity.length, paused]);

  if (activity.length === 0) return null;
  const item = activity[index];

  return (
    <div
      className="overflow-hidden border-b border-[var(--line)] bg-[var(--bg-raised)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-[1180px] px-4 py-2 sm:px-6">
        <TickerItem key={`${item.id}-${index}`} item={item} />
      </div>
    </div>
  );
}

const KIND_META: Record<TickerActivity["kind"], { icon: string; label: string }> = {
  post: { icon: "📝", label: "の制作タイムラインを更新" },
  comment: { icon: "💬", label: "のコメントを更新" },
  "murmur-comment": { icon: "💬", label: "つぶやきコメントを更新" },
};

function TickerItem({ item }: { item: TickerActivity }) {
  const meta = KIND_META[item.kind];
  const href = item.kind === "murmur-comment" ? `/post/${item.postId}` : `/work/${item.projectId}`;

  return (
    <div className="[animation:ticker-item-in_0.35s_ease-out]">
      {/* モバイルは横幅が狭く全文が収まらないため省略記号で切る。sm以上は
          横幅に余裕があるので、そのまま全文を表示する。 */}
      <Link
        href={href}
        className="block truncate text-[12.5px] hover:underline sm:overflow-visible sm:text-clip sm:whitespace-nowrap"
      >
        <span className="font-medium text-[var(--ink)]">{item.authorName}</span>
        <span className="text-[var(--ink-soft)]">
          {item.kind === "murmur-comment" ? "が" : `が「${item.projectTitle}」`}
          {meta.label}
        </span>
        <span className="ml-1 text-[var(--ink-faint)]">
          {meta.icon} {formatRelativeHours(item.hoursAgo)}
        </span>
      </Link>
    </div>
  );
}
