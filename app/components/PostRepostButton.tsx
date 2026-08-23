"use client";

import { useMemo, useState } from "react";
import { togglePostRepost, useHasRepostedPost } from "@/app/lib/repost-store";

export function PostRepostButton({
  postId,
  count,
  size = "sm",
}: {
  postId: string;
  count: number;
  size?: "sm" | "md";
}) {
  const reposted = useHasRepostedPost(postId);
  const [initiallyReposted] = useState(reposted);
  const displayCount = useMemo(
    () => count - (initiallyReposted ? 1 : 0) + (reposted ? 1 : 0),
    [count, initiallyReposted, reposted],
  );
  const padding = size === "md" ? "px-3 py-1.5 text-[13px]" : "px-2.5 py-1 text-[11px]";

  return (
    <button
      type="button"
      aria-pressed={reposted}
      aria-label={reposted ? "つぶやきの紹介を取り消す" : "つぶやきを紹介する"}
      title={reposted ? "紹介中" : "紹介する"}
      onClick={() => togglePostRepost(postId)}
      className={`inline-flex w-fit items-center gap-1 rounded-full border transition-all active:scale-90 ${padding} ${
        reposted
          ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
          : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
      }`}
    >
      <span aria-hidden>🔁</span>
      <span className="font-mono">{displayCount}</span>
    </button>
  );
}
