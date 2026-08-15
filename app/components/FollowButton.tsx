"use client";

import { toggleFollow, useIsFollowing } from "@/app/lib/follow-store";

export function FollowButton({
  author,
  size = "sm",
}: {
  author: string;
  size?: "sm" | "md";
}) {
  const following = useIsFollowing(author);
  const padding = size === "md" ? "px-4 py-1.5 text-[13px]" : "px-3 py-1 text-[11.5px]";

  return (
    <button
      type="button"
      onClick={() => toggleFollow(author)}
      aria-pressed={following}
      className={`shrink-0 rounded-full border font-medium transition-colors ${padding} ${
        following
          ? "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          : "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-90"
      }`}
    >
      {following ? "フォロー中" : "フォローする"}
    </button>
  );
}
