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
          ? "border-transparent bg-[var(--accent-soft)] text-[var(--accent)] hover:opacity-80"
          : "border-[var(--accent)] bg-transparent text-[var(--accent)] hover:bg-[var(--accent-soft)]"
      }`}
    >
      {following ? "フォロー中" : "フォローする"}
    </button>
  );
}
