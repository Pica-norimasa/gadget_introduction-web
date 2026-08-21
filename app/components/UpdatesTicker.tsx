"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ActivityView } from "@/app/lib/queries";
import { POST_TYPE_META } from "@/app/lib/mock-data";
import { formatRelativeHours } from "@/app/lib/format";

const HOLD_MS = 10000;

// ヘッダー直下で、最新の創作活動(制作タイムライン更新)を1件ずつ
// 見せるティッカー。常時流れっぱなしだと鬱陶しいという指摘を受け、
// 右からシュッと1件入ってきて少し静止し、また次が入ってくる方式にした
// (globals.cssのticker-item-in参照)。hover中は切り替えを止める。
export function UpdatesTicker({ activity }: { activity: ActivityView[] }) {
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

function TickerItem({ item }: { item: ActivityView }) {
  const meta = POST_TYPE_META[item.type];
  const text = (
    <span className="whitespace-nowrap text-[12.5px]">
      <span className="font-medium text-[var(--ink)]">{item.authorName}</span>
      <span className="text-[var(--ink-soft)]">
        {item.projectTitle ? `が「${item.projectTitle}」を更新` : "が投稿"}
      </span>
      <span className="ml-1 text-[var(--ink-faint)]">
        {meta.icon} {formatRelativeHours(item.hoursAgo)}
      </span>
    </span>
  );

  return (
    <div className="[animation:ticker-item-in_0.35s_ease-out]">
      {item.projectId ? (
        <Link href={`/work/${item.projectId}`} className="hover:underline">
          {text}
        </Link>
      ) : (
        text
      )}
    </div>
  );
}
