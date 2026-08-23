import Link from "next/link";
import type { StandalonePostView } from "@/app/lib/queries";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";
import { LikeButton } from "./LikeButton";
import { OpenComposerButton } from "./OpenComposerButton";
import { VerifiedBadge } from "./VerifiedBadge";
import { YouTubeCard } from "./YouTubeCard";

// プロジェクトに紐付けない気軽な投稿専用の縦リスト。
// 以前は横スクロールの帯だったが、ホーム内で操作モデルが混ざると
// 特にモバイルで分かりづらいため、PC/モバイルとも縦に読む形にした。
// クリック先は/post/[id](投稿単体の詳細ページ、コメントも付けられる)。
export function MurmurStrip({
  posts,
  likedPostIds,
  embedded = false,
}: {
  posts: StandalonePostView[];
  likedPostIds: ReadonlySet<string> | string[];
  embedded?: boolean;
}) {
  const likedPostIdSet = likedPostIds instanceof Set ? likedPostIds : new Set(likedPostIds);

  return (
    <div id="murmurs" className={embedded ? "" : "mx-auto max-w-[1180px] scroll-mt-24 px-4 pt-[54px] sm:px-6"}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          {!embedded && (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
              つぶやきタイムライン
            </p>
          )}
          <p className={`${embedded ? "" : "mt-1"} text-[12px] text-[var(--ink-faint)]`}>
            作品に紐づかない、気軽な投稿が新しい順に流れます。
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--ink-faint)]">
          <OpenComposerButton />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-raised)] p-8 text-center">
          <p className="text-sm font-medium text-[var(--ink-soft)]">まだつぶやきはありません</p>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--ink-faint)]">
            思いついたことや相談したいことを、気軽に投稿してみてください。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.slice(0, 6).map((post) => (
            <div
              id={`murmur-${post.id}`}
              key={post.id}
              className="flex min-h-[176px] flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3.5 hover:border-[var(--accent)]"
            >
              <Link href={`/post/${post.id}`} className="flex flex-1 flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <AuthorAvatar name={post.authorName} image={post.authorImage} size={26} />
                  <span className="min-w-0 truncate text-[12.5px]">
                    <span className="font-medium text-[var(--ink-soft)]">{post.authorName}</span>
                    {post.authorVerified && <VerifiedBadge className="ml-1 inline-block align-[-1px]" />}{" "}
                    {post.authorSocialHandle && (
                      <span className="text-[var(--ink-faint)]">@{post.authorSocialHandle}</span>
                    )}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-[var(--ink-faint)]">
                    {formatRelativeHours(post.hoursAgo)}
                  </span>
                </div>
                {post.body && (
                  <p className="line-clamp-4 text-[13.5px] leading-7 text-[var(--ink)]">{post.body}</p>
                )}
                {post.inspiredByProjectId && post.inspiredByProjectTitle && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-[var(--teal)] bg-[var(--teal-soft)] px-2 py-0.5 text-[11px] text-[var(--teal)]">
                      🌱 {post.inspiredByProjectTitle}
                    </span>
                  </div>
                )}
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
                  <img src={post.imageUrl} alt="" className="h-28 w-full rounded-xl object-cover" />
                )}
                {post.youtubeUrl && <YouTubeCard youtubeUrl={post.youtubeUrl} linked={false} />}
              </Link>
              <div className="mt-1 flex items-center gap-3">
                <LikeButton postId={post.id} liked={likedPostIdSet.has(post.id)} count={post.likesCount} />
                <Link href={`/post/${post.id}`} className="font-mono text-[11px] text-[var(--ink-faint)] hover:underline">
                  💬{post.commentsCount}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
