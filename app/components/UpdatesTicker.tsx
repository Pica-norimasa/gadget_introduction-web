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
      className="overflow-hidden border-b border-[var(--line)] bg-[var(--bg-raised)]/75"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-[1180px] px-4 py-2.5 sm:px-6 sm:py-2">
        <TickerItem key={`${item.id}-${index}`} item={item} />
      </div>
    </div>
  );
}

// stage-upだけ他の活動より目立たせたいので、他はテーマの控えめなink-soft、
// stage-upだけaccent色にしている。
const KIND_META: Record<TickerActivity["kind"], { icon: string; color: string }> = {
  post: { icon: "📝", color: "text-[var(--ink-soft)]" },
  comment: { icon: "💬", color: "text-[var(--ink-soft)]" },
  "murmur-comment": { icon: "💬", color: "text-[var(--ink-soft)]" },
  "stage-up": { icon: "🎉", color: "text-[var(--accent)]" },
};

function labelFor(item: TickerActivity): string {
  switch (item.kind) {
    case "post":
      return `が「${item.projectTitle}」の制作タイムラインを更新`;
    case "comment":
      return `が「${item.projectTitle}」のコメントを更新`;
    case "murmur-comment":
      return "がつぶやきコメントを更新";
    case "stage-up":
      return `の「${item.projectTitle}」が${item.stage}にステップアップ`;
  }
}

function TickerItem({ item }: { item: TickerActivity }) {
  const meta = KIND_META[item.kind];
  const href = item.kind === "murmur-comment" ? `/post/${item.postId}` : `/work/${item.projectId}`;

  return (
    <div className="[animation:ticker-item-in_0.35s_ease-out]">
      {/* モバイルは横幅が狭く全文が収まらないため省略記号で切る。sm以上は
          横幅に余裕があるので、そのまま全文を表示する。 */}
      <Link
        href={href}
        className="block truncate text-[11.5px] leading-5 text-[var(--ink-faint)] hover:underline sm:overflow-visible sm:text-clip sm:whitespace-nowrap sm:text-[12.5px]"
      >
        <span className="font-medium text-[var(--ink-soft)]">{item.authorName}</span>
        <span className={item.kind === "stage-up" ? `font-medium ${meta.color}` : meta.color}>
          {labelFor(item)}
        </span>
        <span className="ml-1 text-[var(--ink-faint)]">
          {meta.icon} {formatRelativeHours(item.hoursAgo)}
        </span>
      </Link>
    </div>
  );
}
