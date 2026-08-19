import Link from "next/link";
import type { StandalonePostView } from "@/app/lib/queries";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";
import { YouTubeCard } from "./YouTubeCard";

// 単独投稿(つぶやき)を縦積みの一覧で見せるための簡易カード。
// MurmurStripの横スクロールカードとは表示文脈が違う(あちらは
// いいね件数付きの帯用)ため、こちらは意図的に別コンポーネントにして
// いる。作品詳細ページの「この作品からインスパイアされた投稿」と
// 検索結果ページの両方から使う。
export function StandalonePostCard({
  post,
}: {
  post: Pick<
    StandalonePostView,
    | "id"
    | "authorName"
    | "authorHandle"
    | "authorSocialHandle"
    | "authorImage"
    | "body"
    | "hoursAgo"
    | "youtubeUrl"
    | "inspiredByProjectId"
    | "inspiredByProjectTitle"
  >;
}) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 hover:border-[var(--accent)]"
    >
      <AuthorAvatar name={post.authorName} image={post.authorImage} size={28} />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[12px] text-[var(--ink-faint)]">
          <span className="font-medium text-[var(--ink-soft)]">{post.authorName}</span>{" "}
          {post.authorSocialHandle && <span>@{post.authorSocialHandle}</span>} ・{" "}
          {formatRelativeHours(post.hoursAgo)}
        </p>
        {post.body && <p className="text-[13px] leading-relaxed text-[var(--ink)]">{post.body}</p>}
        {post.youtubeUrl && <YouTubeCard youtubeUrl={post.youtubeUrl} linked={false} className="mt-2 max-w-[220px]" />}
        {post.inspiredByProjectId && post.inspiredByProjectTitle && (
          <span className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-full border border-[var(--teal)] bg-[var(--teal-soft)] px-2 py-0.5 text-[11px] text-[var(--teal)]">
            🌱 {post.inspiredByProjectTitle}
          </span>
        )}
      </div>
    </Link>
  );
}
