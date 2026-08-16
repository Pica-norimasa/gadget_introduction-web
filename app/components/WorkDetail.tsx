import Link from "next/link";
import { POST_TYPE_META, type Post, type ReactionKey, type Work } from "@/app/lib/mock-data";
import type { CommentView } from "@/app/lib/queries";
import { formatCount, formatPostedAgo, formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";
import { CommentForm } from "./CommentForm";
import { CoverImage } from "./CoverImage";
import { DeleteCommentButton } from "./DeleteCommentButton";
import { FollowButton } from "./FollowButton";
import { GitHubCard } from "./GitHubCard";
import { MotionThumb } from "./MotionThumb";
import { PlatformBadges } from "./PlatformBadges";
import { ReactionBar } from "./ReactionBar";
import { RepostButton } from "./RepostButton";
import { ShareButtons } from "./ShareButtons";
import { SiteHeader } from "./SiteHeader";
import { StageBadge } from "./StageBadge";
import { TimelinePostForm } from "./TimelinePostForm";
import { ToolBadge } from "./ToolBadge";
import { WorkThumb } from "./WorkThumb";

export function WorkDetail({
  work,
  timeline,
  myReactions,
  comments,
  currentUserId,
}: {
  work: Work;
  timeline: Post[];
  myReactions: ReactionKey[];
  comments: CommentView[];
  currentUserId: string | null;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          >
            ← 発見に戻る
          </Link>
          {work.authorId === currentUserId && (
            <div className="flex items-center gap-2">
              <Link
                href="/guide"
                className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)] hover:text-[var(--ink)]"
              >
                使い方を見る
              </Link>
              <Link
                href={`/work/${work.id}/edit`}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)] hover:text-[var(--ink)]"
              >
                ✎ 編集する
              </Link>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Link href={`/u/${encodeURIComponent(work.author)}`} className="flex min-w-0 flex-1 items-center gap-2">
            <AuthorAvatar name={work.author} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[var(--ink)] hover:underline">{work.author}</p>
              <p className="text-[12px] text-[var(--ink-faint)]">{formatPostedAgo(work.daysAgo)}に投稿</p>
            </div>
          </Link>
          {work.authorId !== currentUserId && <FollowButton author={work.author} size="md" />}
        </div>

        <div className="mb-4">
          {work.coverImageUrl ? (
            <CoverImage src={work.coverImageUrl} size="lg" />
          ) : !work.glyph && work.githubUrl ? (
            <GitHubCard githubUrl={work.githubUrl} size="lg" />
          ) : work.glyph && work.hasMotion ? (
            <MotionThumb hue={work.hue} glyph={work.glyph} size="lg" />
          ) : (
            <WorkThumb hue={work.hue} glyph={work.glyph} catchText={work.catch} size="lg" />
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <StageBadge stage={work.stage} />
          <ToolBadge tool={work.tool} />
          <PlatformBadges platforms={work.platforms} />
        </div>

        <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-bold leading-snug text-[var(--ink)]">
          {work.title}
        </h1>
        <p className="mb-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--ink-soft)]">{work.catch}</p>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <ReactionBar workId={work.id} reactions={work.reactions} myReactions={myReactions} />
            <RepostButton projectId={work.id} count={work.reposts} size="md" allowQuote />
          </div>
          <span className="font-mono text-[12px] text-[var(--ink-faint)]">
            👁️{formatCount(work.views)} · 💬{work.comments}
          </span>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
            制作タイムライン
          </h2>
          <ol className="relative ml-2 border-l-2 border-[var(--line)] pl-5">
            {timeline.map((post) => (
              <li key={post.id} className="relative mb-5 last:mb-0">
                <span
                  aria-hidden
                  className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg)]"
                  style={{ background: post.hoursAgo < 24 ? "var(--teal)" : "var(--ink-faint)" }}
                />
                <p className="mb-0.5 font-mono text-[11px] font-medium text-[var(--ink-faint)]">
                  {POST_TYPE_META[post.type].icon} {POST_TYPE_META[post.type].label} ・{" "}
                  {formatRelativeHours(post.hoursAgo)}
                </p>
                {post.body && <p className="text-[14px] leading-relaxed text-[var(--ink)]">{post.body}</p>}
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="mt-2 max-h-80 max-w-full rounded-xl border border-[var(--line)] object-contain"
                  />
                )}
              </li>
            ))}
          </ol>
          {work.authorId === currentUserId && (
            <div className="mt-4">
              <TimelinePostForm projectId={work.id} />
            </div>
          )}
        </div>

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
                        {c.authorId === currentUserId && <DeleteCommentButton commentId={c.id} />}
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
          <CommentForm projectId={work.id} />
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <p className="mb-2 text-[12px] font-medium text-[var(--ink-faint)]">この作品を共有</p>
          <ShareButtons title={work.title} />
        </div>
      </main>
    </div>
  );
}
