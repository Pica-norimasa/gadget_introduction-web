import Link from "next/link";
import type { StandalonePostView } from "@/app/lib/queries";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";
import { HorizontalScroller } from "./HorizontalScroller";
import { LikeButton } from "./LikeButton";
import { YouTubeCard } from "./YouTubeCard";

// プロジェクトに紐付けない気軽な投稿専用の、横スクロールの帯。
// プロダクト一覧(HeroRail/FeedSection)を主役の座から動かしたくない
// ので、その下に控えめなサイズで挟み込む形にしている(StoriesStripと
// 同じ「ヒーローの下に細い帯」という配置パターン)。クリック先は
// /post/[id](投稿単体の詳細ページ、コメントも付けられる)。
export function MurmurStrip({
  posts,
  likedPostIds,
}: {
  posts: StandalonePostView[];
  likedPostIds: Set<string>;
}) {
  if (posts.length === 0) return null;

  return (
    <div id="murmurs" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-[54px] sm:px-6">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">つぶやき</p>
      <HorizontalScroller className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex w-56 shrink-0 flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 hover:border-[var(--accent)]"
          >
            <Link href={`/post/${post.id}`} className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <AuthorAvatar name={post.authorName} image={post.authorImage} size={24} />
                <span className="min-w-0 truncate text-[12px]">
                  <span className="font-medium text-[var(--ink-soft)]">{post.authorName}</span>{" "}
                  {post.authorSocialHandle && (
                    <span className="text-[var(--ink-faint)]">@{post.authorSocialHandle}</span>
                  )}
                </span>
                <span className="ml-auto shrink-0 text-[11px] text-[var(--ink-faint)]">
                  {formatRelativeHours(post.hoursAgo)}
                </span>
              </div>
              {post.body && (
                <p className="line-clamp-3 text-[13px] leading-relaxed text-[var(--ink)]">{post.body}</p>
              )}
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
                <img src={post.imageUrl} alt="" className="h-20 w-full rounded-lg object-cover" />
              )}
              {post.youtubeUrl && <YouTubeCard youtubeUrl={post.youtubeUrl} linked={false} />}
              {post.inspiredByProjectId && post.inspiredByProjectTitle && (
                <span className="inline-flex max-w-full items-center gap-1 truncate self-start rounded-full border border-[var(--teal)] bg-[var(--teal-soft)] px-2 py-0.5 text-[11px] text-[var(--teal)]">
                  🌱 {post.inspiredByProjectTitle}
                </span>
              )}
            </Link>
            <div className="mt-auto flex items-center gap-3">
              <LikeButton postId={post.id} liked={likedPostIds.has(post.id)} count={post.likesCount} />
              <Link href={`/post/${post.id}`} className="font-mono text-[11px] text-[var(--ink-faint)] hover:underline">
                💬{post.commentsCount}
              </Link>
            </div>
          </div>
        ))}
      </HorizontalScroller>
    </div>
  );
}
