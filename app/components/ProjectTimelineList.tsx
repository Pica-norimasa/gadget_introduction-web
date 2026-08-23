"use client";

import { useEffect, useRef } from "react";
import { type Post } from "@/app/lib/mock-data";
import { formatRelativeHours } from "@/app/lib/format";
import { LatestCommitEntry } from "./LatestCommitEntry";
import { PostEditor } from "./PostEditor";
import { PostTypeBadge } from "./PostTypeBadge";

// 制作タイムラインは投稿が増えるほどページ全体がどこまでも伸びてしまう
// ため、一定の高さのスクロール領域に収める。エントリは古い順
// (post-helpers.tsのpostsForProject参照)に並ぶので、素朴にスクロール領域に
// するだけだと開いた瞬間は一番古い投稿が見えてしまう。一番知りたいのは
// 最新の投稿のはずなので、マウント時に一番下までスクロールしておく。
export function ProjectTimelineList({
  timeline,
  isOwner,
  githubUrl,
}: {
  timeline: Post[];
  isOwner: boolean;
  githubUrl?: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [timeline.length]);

  return (
    <div ref={scrollRef} className="max-h-[520px] overflow-y-auto pr-5">
      <ol className="relative ml-2 border-l-2 border-[var(--line)] pl-5">
        {timeline.map((post, index) => (
          <li key={post.id} className="relative mb-7 last:mb-0">
            <span
              aria-hidden
              className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg)]"
              style={{ background: post.hoursAgo < 24 ? "var(--teal)" : "var(--ink-faint)" }}
            />
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px]">
              <span className="font-mono text-[var(--ink-faint)]">#{index + 1}</span>
              <PostTypeBadge type={post.type} className="text-[11px]" />
              <span className="text-[var(--ink-faint)]">{formatRelativeHours(post.hoursAgo)}</span>
            </p>
            <PostEditor
              postId={post.id}
              body={post.body}
              imageUrl={post.imageUrl}
              youtubeUrl={post.youtubeUrl}
              isOwner={isOwner}
              bodyClassName="text-[14px] leading-relaxed text-[var(--ink)]"
            />
          </li>
        ))}
        {githubUrl && <LatestCommitEntry githubUrl={githubUrl} />}
      </ol>
    </div>
  );
}
