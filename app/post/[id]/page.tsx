import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommentsForPost, getPostById } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "@/app/components/AuthorAvatar";
import { CommentForm } from "@/app/components/CommentForm";
import { DeleteCommentButton } from "@/app/components/DeleteCommentButton";
import { MoreActionsMenu } from "@/app/components/MoreActionsMenu";
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
            href={`/u/${encodeURIComponent(post.authorName)}`}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <AuthorAvatar name={post.authorName} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[var(--ink)] hover:underline">
                {post.authorName}
              </p>
              <p className="text-[12px] text-[var(--ink-faint)]">{formatRelativeHours(post.hoursAgo)}</p>
            </div>
          </Link>
        </div>

        {post.body && (
          <p className="mb-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--ink)]">{post.body}</p>
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
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
            コメント({comments.length})
          </h2>
          <div className="mb-4 flex flex-col gap-3">
            {comments.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-faint)]">まだコメントはありません</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3">
                  <div className="flex items-start gap-2">
                    <Link href={`/u/${encodeURIComponent(c.authorName)}`} className="shrink-0">
                      <AuthorAvatar name={c.authorName} size={28} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-[12px] text-[var(--ink-faint)]">
                          <Link
                            href={`/u/${encodeURIComponent(c.authorName)}`}
                            className="font-medium text-[var(--ink-soft)] hover:underline"
                          >
                            {c.authorName}
                          </Link>{" "}
                          ・ {formatRelativeHours(c.hoursAgo)}
                        </p>
                        {c.authorId === currentUser?.id ? (
                          <DeleteCommentButton commentId={c.id} />
                        ) : (
                          <MoreActionsMenu
                            reportTarget={{ type: "comment", id: c.id }}
                            author={{ id: c.authorId, name: c.authorName }}
                          />
                        )}
                      </div>
                      {c.body && <p className="text-[14px] leading-relaxed text-[var(--ink)]">{c.body}</p>}
                      {c.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
                        <img
                          src={c.imageUrl}
                          alt=""
                          className="mt-2 max-h-64 max-w-full rounded-xl border border-[var(--line)] object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <CommentForm target={{ type: "post", id: post.id }} />
        </div>
      </main>
    </div>
  );
}
