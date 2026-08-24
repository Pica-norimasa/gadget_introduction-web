"use client";

import { useEffect, useRef } from "react";
import type { CommentThread as CommentThreadType } from "@/app/lib/queries";
import { CommentThread } from "./CommentThread";

// コメント欄も投稿が増えるほどページ全体がどこまでも伸びてしまうため、
// 制作タイムライン(ProjectTimelineList.tsx)と同じく一定の高さの
// スクロール領域に収める。コメントは古い順に並ぶので、マウント時に
// 一番下(最新)までスクロールしておく。
export function CommentList({
  comments,
  target,
  currentUserId,
  isLoggedIn,
  guestCommentCount,
  contentAuthorId,
  contentMemberIds = [],
}: {
  comments: CommentThreadType[];
  target: { type: "project" | "post"; id: string };
  currentUserId: string | null;
  isLoggedIn: boolean;
  guestCommentCount: number;
  contentAuthorId: string;
  contentMemberIds?: string[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [comments.length]);

  if (comments.length === 0) {
    return <p className="mb-4 text-[13px] text-[var(--ink-faint)]">まだコメントはありません</p>;
  }

  return (
    <div ref={scrollRef} className="mb-4 max-h-[520px] overflow-y-auto pr-5">
      <div className="flex flex-col gap-3.5">
        {comments.map((c) => (
          <CommentThread
            key={c.id}
            thread={c}
            target={target}
            currentUserId={currentUserId}
            isLoggedIn={isLoggedIn}
            guestCommentCount={guestCommentCount}
            contentAuthorId={contentAuthorId}
            contentMemberIds={contentMemberIds}
          />
        ))}
      </div>
    </div>
  );
}
