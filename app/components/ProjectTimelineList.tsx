"use client";

import { useEffect, useRef, useState } from "react";
import { type ExperienceType, type Post } from "@/app/lib/mock-data";
import { formatRelativeHours } from "@/app/lib/format";
import { ExperienceTypeBadge } from "./ExperienceTypeBadge";
import { HelpfulButton } from "./HelpfulButton";
import { LatestCommitEntry } from "./LatestCommitEntry";
import { PostEditor } from "./PostEditor";
import { PostTypeBadge } from "./PostTypeBadge";

const STAT_LABELS: { key: "learning" | "failure" | "success"; label: string; icon: string }[] = [
  { key: "learning", label: "学び", icon: "📘" },
  { key: "failure", label: "失敗", icon: "💡" },
  { key: "success", label: "成功", icon: "✅" },
];

// 制作タイムラインは投稿が増えるほどページ全体がどこまでも伸びてしまう
// ため、一定の高さのスクロール領域に収める。エントリは古い順
// (post-helpers.tsのpostsForProject参照)に並ぶので、素朴にスクロール領域に
// するだけだと開いた瞬間は一番古い投稿が見えてしまう。一番知りたいのは
// 最新の投稿のはずなので、マウント時に一番下までスクロールしておく。
export function ProjectTimelineList({
  timeline,
  isOwner,
  githubUrl,
  helpfulCounts,
  myHelpfulPostIds,
  experienceStats,
}: {
  timeline: Post[];
  isOwner: boolean;
  githubUrl?: string | null;
  helpfulCounts: Record<string, number>;
  myHelpfulPostIds: string[];
  experienceStats: Record<"failure" | "success" | "learning", number>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // 「学び8・失敗3・成功5」のクリックで絞り込む(experienceType一致だけ
  // 表示、もう一度押すと解除)。投稿番号(#N)は絞り込み前の通し番号のまま
  // にするため、フィルタは表示直前にかけるだけで元の配列・indexは変えない。
  const [filter, setFilter] = useState<ExperienceType | null>(null);
  const myHelpfulPostIdSet = new Set(myHelpfulPostIds);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [timeline.length]);

  useEffect(() => {
    // フィルタを切り替えたときは、絞り込み後の内容が見えるよう先頭に戻す。
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
  }, [filter]);

  const hasAnyStat = STAT_LABELS.some(({ key }) => experienceStats[key] > 0);

  return (
    <div>
      {hasAnyStat && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {STAT_LABELS.map(({ key, label, icon }) =>
            experienceStats[key] > 0 ? (
              <button
                key={key}
                type="button"
                onClick={() => setFilter((f) => (f === key ? null : key))}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                  filter === key
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]"
                    : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
                }`}
              >
                {icon} {label} {experienceStats[key]}
              </button>
            ) : null,
          )}
        </div>
      )}
      <div
        ref={scrollRef}
        data-timeline-scroll-container
        className="max-h-[520px] overflow-y-auto pr-5 [overflow-anchor:none]"
      >
        <ol className="relative ml-2 border-l-2 border-[var(--line)] pl-5">
          {timeline.map((post, index) => {
            if (filter && post.experienceType !== filter) return null;
            return (
              <li key={post.id} className="relative mb-7 last:mb-0">
                <span
                  aria-hidden
                  className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg)]"
                  style={{ background: post.hoursAgo < 24 ? "var(--teal)" : "var(--ink-faint)" }}
                />
                <p className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="font-mono text-[var(--ink-faint)]">#{index + 1}</span>
                  <PostTypeBadge type={post.type} className="text-[11px]" />
                  {post.experienceType && <ExperienceTypeBadge type={post.experienceType} className="text-[11px]" />}
                  <span className="text-[var(--ink-faint)]">{formatRelativeHours(post.hoursAgo)}</span>
                </p>
                <PostEditor
                  postId={post.id}
                  body={post.body}
                  imageUrl={post.imageUrl}
                  youtubeUrl={post.youtubeUrl}
                  type={post.type}
                  experienceType={post.experienceType}
                  isOwner={isOwner}
                  bodyClassName="text-[14px] leading-relaxed text-[var(--ink)]"
                />
                <div className="mt-1.5">
                  <HelpfulButton
                    postId={post.id}
                    helpful={myHelpfulPostIdSet.has(post.id)}
                    count={helpfulCounts[post.id] ?? 0}
                  />
                </div>
              </li>
            );
          })}
          {!filter && githubUrl && <LatestCommitEntry githubUrl={githubUrl} />}
        </ol>
      </div>
    </div>
  );
}
