"use client";

import { useEffect, useRef } from "react";
import { POST_TYPE_META, type Post } from "@/app/lib/mock-data";
import { formatRelativeHours } from "@/app/lib/format";
import { PostEditor } from "./PostEditor";

// 制作タイムラインは投稿が増えるほどページ全体がどこまでも伸びてしまう
// ため、一定の高さのスクロール領域に収める。エントリは古い順
// (post-helpers.tsのpostsForProject参照)に並ぶので、素朴にスクロール領域に
// するだけだと開いた瞬間は一番古い投稿が見えてしまう。一番知りたいのは
// 最新の投稿のはずなので、マウント時に一番下までスクロールしておく。
export function ProjectTimelineList({ timeline, isOwner }: { timeline: Post[]; isOwner: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [timeline.length]);

  return (
    <div ref={scrollRef} className="max-h-[520px] overflow-y-auto pr-5">
      <ol className="relative ml-2 border-l-2 border-[var(--line)] pl-5">
        {timeline.map((post) => (
          <li key={post.id} className="relative mb-5 last:mb-0">
            <span
              aria-hidden
              className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg)]"
              style={{ background: post.hoursAgo < 24 ? "var(--teal)" : "var(--ink-faint)" }}
            />
            <p className="mb-0.5 font-mono text-[11px] font-medium text-[var(--ink-faint)]">
              {POST_TYPE_META[post.type].icon} {POST_TYPE_META[post.type].label} ・{" "}
              {formatRelativeHours(post.hoursAgo)}
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
      </ol>
    </div>
  );
}
