import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getCommentsForPost,
  getMyCommentCount,
  getMyLikeForPost,
  getPostById,
  isBlockedByAuthor,
  type PostDetailView,
} from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SITE_URL } from "@/app/lib/email";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "@/app/components/AuthorAvatar";
import { CommentForm } from "@/app/components/CommentForm";
import { CommentThread } from "@/app/components/CommentThread";
import { LikeButton } from "@/app/components/LikeButton";
import { MoreActionsMenu } from "@/app/components/MoreActionsMenu";
import { PostEditor } from "@/app/components/PostEditor";
import { PostXShareButton } from "@/app/components/PostXShareButton";
import { SiteHeader } from "@/app/components/SiteHeader";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "投稿が見つかりません | Draftly" };

  const description = post.body
    ? post.body.length > 110
      ? `${post.body.slice(0, 110)}…`
      : post.body
    : "Draftlyに投稿されたつぶやき";
  const title = `${post.authorName}のつぶやき`;

  return {
    title: `${title} | Draftly`,
    description,
    alternates: { canonical: `${SITE_URL}/post/${post.id}` },
    openGraph: { title: `${title} | Draftly`, description, type: "article", siteName: "Draftly" },
    twitter: { card: "summary_large_image", title: `${title} | Draftly`, description },
  };
}

// 検索エンジン向けの構造化データ(schema.org/SocialMediaPosting)。
// 短文の単独投稿(つぶやき)向けにCreativeWorkのサブタイプを使う。
function postJsonLd(post: PostDetailView) {
  return {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    articleBody: post.body,
    url: `${SITE_URL}/post/${post.id}`,
    datePublished: post.createdAtIso,
    author: {
      "@type": "Person",
      name: post.authorName,
      url: `${SITE_URL}/u/${encodeURIComponent(post.authorHandle)}`,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [post, comments, currentUser, session, guestCommentCount] = await Promise.all([
    getPostById(id),
    getCommentsForPost(id),
    getCurrentUser(),
    auth(),
    getMyCommentCount(),
  ]);
  if (!post) notFound();
  const isLoggedIn = !!session?.user;

  const [liked, blockedByAuthor] = await Promise.all([
    getMyLikeForPost(post.id),
    isBlockedByAuthor(post.authorId),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd(post)) }} />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ← ホームに戻る
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
                {post.authorVerified && <VerifiedBadge className="ml-1 inline-block align-[-1px]" />}
                {post.authorSocialHandle && (
                  <span className="ml-1 font-normal text-[var(--ink-faint)]">@{post.authorSocialHandle}</span>
                )}
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

        <div className="mb-4">
          <PostEditor
            postId={post.id}
            body={post.body}
            imageUrl={post.imageUrl}
            youtubeUrl={post.youtubeUrl}
            isOwner={post.authorId === currentUser?.id}
            imageClassName="max-h-[480px] w-full rounded-2xl border border-[var(--line)] object-contain"
            youtubeClassName="max-w-md"
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {blockedByAuthor ? (
            <span className="text-[12px] text-[var(--ink-faint)]">
              この投稿の作者にブロックされているため、反応できません
            </span>
          ) : (
            <LikeButton postId={post.id} liked={liked} count={post.likesCount} size="md" />
          )}
          {post.authorId === currentUser?.id && currentUser?.xUsername && (
            <PostXShareButton text={post.body} />
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
                  isLoggedIn={isLoggedIn}
                  guestCommentCount={guestCommentCount}
                  contentAuthorId={post.authorId}
                />
              ))
            )}
          </div>
          {blockedByAuthor ? (
            <p className="text-[13px] text-[var(--ink-faint)]">
              この投稿の作者にブロックされているため、コメントできません
            </p>
          ) : (
            <CommentForm
              target={{ type: "post", id: post.id }}
              isLoggedIn={isLoggedIn}
              guestCommentCount={guestCommentCount}
            />
          )}
        </div>
      </main>
    </div>
  );
}
