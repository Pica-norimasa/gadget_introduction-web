"use client";

import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@/app/lib/auth-store";
import { toggleFollow, useIsFollowing } from "@/app/lib/follow-store";

export function FollowButton({
  author,
  size = "sm",
}: {
  author: string;
  size?: "sm" | "md";
}) {
  const following = useIsFollowing(author);
  const isLoggedIn = useIsLoggedIn();
  const router = useRouter();
  const padding = size === "md" ? "px-4 py-1.5 text-[13px]" : "px-3 py-1 text-[11.5px]";

  // フォローは匿名ゲストの使い捨てアカウントによる水増し対策としてログイン
  // 必須にした。未ログインならトグルせず、ログインページへ促す。ボタンの
  // 見た目・文言自体でログインが要ることを事前に示す(投稿・コメントの
  // ログイン導線と同じく、押すまで気づけない状態を避ける)。
  function handleClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    toggleFollow(author);
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`shrink-0 rounded-full border border-[var(--line)] bg-transparent font-medium text-[var(--ink-faint)] transition-colors hover:border-[var(--ink-faint)] hover:text-[var(--ink-soft)] ${padding}`}
      >
        ログインしてフォロー
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
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
