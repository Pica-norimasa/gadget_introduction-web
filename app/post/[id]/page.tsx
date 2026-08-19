import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommentsForPost, getMyLikeForPost, getPostById, isBlockedByAuthor } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "@/app/components/AuthorAvatar";
import { CommentForm } from "@/app/components/CommentForm";
import { CommentThread } from "@/app/components/CommentThread";
import { LikeButton } from "@/app/components/LikeButton";
import { MoreActionsMenu } from "@/app/components/MoreActionsMenu";
import { PostEditor } from "@/app/components/PostEditor";
import { SiteHeader } from "@/app/components/SiteHeader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "投稿が見つかりません | Draftly" };
  const preview = post.body.length > 40 ? `${post.body.slice(0, 40)}…` : post.body;
  return { title: `${post.authorName}の投稿「${preview}」 | Draftly` };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [post, comments, currentUser] = await Promise.all([
    getPostById(id),
    getCommentsForPost(id),
    getCurrentUser(),
  ]);
  if (!post) notFound();

  const [liked, blockedByAuthor] = await Promise.all([
    getMyLikeForPost(post.id),
    isBlockedByAuthor(post.authorId),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ← 発見に戻る
        </Link>

        <div className="mb-4 flex items-center gap-2">
          <Link
            href={`/u/${encodeURIComponent(post.authorHandle)}`}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <AuthorAvatar name={post.authorName} image={post.authorImage} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[var(--ink)] hover:underline">
                {post.authorName}
                <span className="ml-1 font-normal text-[var(--ink-faint)]">@{post.authorHandle}</span>
              </p>
              <p className="text-[12px] text-[var(--ink-faint)]">{formatRelativeHours(post.hoursAgo)}</p>
            </div>
          </Link>
          {post.authorId !== currentUser?.id && (
            <MoreActionsMenu
              reportTarget={{ type: "post", id: post.id }}
              author={{ id: post.authorId, name: post.authorName }}
            />
          )}
        </div>

        {post.inspiredByProjectId && post.inspiredByProjectTitle && (
          <Link
            href={`/work/${post.inspiredByProjectId}`}
            className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-[var(--teal)] bg-[var(--teal-soft)] px-2.5 py-1 text-[12px] text-[var(--teal)] hover:underline"
          >
            🌱 {post.inspiredByProjectTitle} からインスパイア
          </Link>
        )}

        {post.authorId === currentUser?.id ? (
          <div className="mb-4">
            <PostEditor postId={post.id} body={post.body} />
          </div>
        ) : (
          post.body && (
            <p className="mb-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--ink)]">{post.body}</p>
          )
        )}
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
          <img
            src={post.imageUrl}
            alt=""
            className="mb-4 max-h-[480px] w-full rounded-2xl border border-[var(--line)] object-contain"
          />
        )}

        <div className="mb-6">
          {blockedByAuthor ? (
            <span className="text-[12px] text-[var(--ink-faint)]">
              この投稿の作者にブロックされているため、反応できません
            </span>
          ) : (
            <LikeButton postId={post.id} liked={liked} count={post.likesCount} size="md" />
          )}
        </div>

        <div className="mb-6">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
            コメント({comments.reduce((sum, c) => sum + 1 + c.replies.length, 0)})
          </h2>
          <div className="mb-4 flex flex-col gap-3">
            {comments.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-faint)]">まだコメントはありません</p>
            ) : (
              comments.map((c) => (
                <CommentThread
                  key={c.id}
                  thread={c}
                  target={{ type: "post", id: post.id }}
                  currentUserId={currentUser?.id ?? null}
                />
              ))
            )}
          </div>
          {blockedByAuthor ? (
            <p className="text-[13px] text-[var(--ink-faint)]">
              この投稿の作者にブロックされているため、コメントできません
            </p>
          ) : (
            <CommentForm target={{ type: "post", id: post.id }} />
          )}
        </div>
      </main>
    </div>
  );
}
