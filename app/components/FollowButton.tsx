"use client";

import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@/app/lib/auth-store";
import { toggleFollow, useIsFollowing } from "@/app/lib/follow-store";

export function FollowButton({
  author,
  size = "sm",
  variant = "card",
}: {
  author: string;
  size?: "sm" | "md";
  // "card" = 通常のフィードカード内(テーマ変数に追従)
  // "dark" = 没入ビューアの黒スクリム上(常に明色固定、ReactionBarのdarkと同じ考え方)
  variant?: "card" | "dark";
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
        className={`shrink-0 rounded-full border font-medium transition-colors ${padding} ${
          variant === "dark"
            ? "border-white bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
            : "border-[var(--line)] bg-transparent text-[var(--ink-faint)] hover:border-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        }`}
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
        variant === "dark"
          ? following
            ? "border-white bg-white text-black hover:opacity-80"
            : "border-white bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
          : following
            ? "border-transparent bg-[var(--accent-soft)] text-[var(--accent)] hover:opacity-80"
            : "border-[var(--accent)] bg-transparent text-[var(--accent)] hover:bg-[var(--accent-soft)]"
      }`}
    >
      {following ? "フォロー中" : "フォローする"}
    </button>
  );
}
