"use client";

import { toggleRepost, useHasReposted } from "@/app/lib/repost-store";

// リアクションと違い、押した瞬間のカウントは楽観的に増減させない(💬コメント数
// と同じ扱い。revalidatePathで次の描画から反映される)。ボタン自体の
// 押下状態(自分がリポスト済みか)だけはグローバルなrepost-store経由で
// 即座に他のインスタンス(カード⇔詳細ページ)にも反映される。
export function RepostButton({
  projectId,
  count,
  size = "sm",
}: {
  projectId: string;
  count: number;
  size?: "sm" | "md";
}) {
  const reposted = useHasReposted(projectId);
  const padding = size === "md" ? "px-3 py-1.5 text-[13px]" : "px-2 py-1 text-[11px]";

  return (
    <button
      type="button"
      aria-pressed={reposted}
      aria-label="リポスト"
      title="リポスト"
      onClick={() => toggleRepost(projectId)}
      className={`inline-flex items-center gap-1 rounded-full border font-mono transition-all active:scale-90 ${padding} ${
        reposted
          ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
          : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
      }`}
    >
      <span aria-hidden>🔁</span>
      {count}
    </button>
  );
}
