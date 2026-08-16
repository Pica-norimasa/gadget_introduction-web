import Link from "next/link";
import type { StandalonePostView } from "@/app/lib/queries";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";

// 単独投稿(つぶやき)を縦積みの一覧で見せるための簡易カード。
// MurmurStripの横スクロールカードとは表示文脈が違う(あちらは
// いいね件数付きの帯用)ため、こちらは意図的に別コンポーネントにして
// いる。作品詳細ページの「この作品からインスパイアされた投稿」と
// 検索結果ページの両方から使う。
export function StandalonePostCard({
  post,
}: {
  post: Pick<StandalonePostView, "id" | "authorName" | "body" | "hoursAgo">;
}) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 hover:border-[var(--accent)]"
    >
      <AuthorAvatar name={post.authorName} size={28} />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[12px] text-[var(--ink-faint)]">
          <span className="font-medium text-[var(--ink-soft)]">{post.authorName}</span> ・{" "}
          {formatRelativeHours(post.hoursAgo)}
        </p>
        {post.body && <p className="text-[13px] leading-relaxed text-[var(--ink)]">{post.body}</p>}
      </div>
    </Link>
  );
}
