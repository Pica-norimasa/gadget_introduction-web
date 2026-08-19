import Link from "next/link";
import { POST_TYPE_META, type Post, type ReactionKey, type Work } from "@/app/lib/mock-data";
import type { CommentThread as CommentThreadType, InspiredItem } from "@/app/lib/queries";
import { formatCount, formatPostedAgo, formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";
import { CommentForm } from "./CommentForm";
import { CommentThread } from "./CommentThread";
import { CoverImage } from "./CoverImage";
import { FollowButton } from "./FollowButton";
import { GitHubCard } from "./GitHubCard";
import { MotionThumb } from "./MotionThumb";
import { PlatformBadges } from "./PlatformBadges";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { PostEditor } from "./PostEditor";
import { ReactionBar } from "./ReactionBar";
import { RepostButton } from "./RepostButton";
import { ShareButtons } from "./ShareButtons";
import { SiteHeader } from "./SiteHeader";
import { StageBadge } from "./StageBadge";
import { StandalonePostCard } from "./StandalonePostCard";
import { TimelinePostForm } from "./TimelinePostForm";
import { ToolBadge } from "./ToolBadge";
import { WorkCard } from "./WorkCard";
import { WorkThumb } from "./WorkThumb";

export function WorkDetail({
  work,
  timeline,
  myReactions,
  comments,
  currentUserId,
  isLoggedIn,
  inspiredItems,
  posts,
  inspiredMyReactions,
  blockedByAuthor,
}: {
  work: Work;
  timeline: Post[];
  myReactions: ReactionKey[];
  comments: CommentThreadType[];
  currentUserId: string | null;
  // コメント投稿にはGitHub/Xログインが必須(荒らし対策)。閲覧・
  // リアクション等は引き続き匿名ゲストのままでも可能なので、
  // currentUserId(匿名ゲストも含む)とは別に持つ。
  isLoggedIn: boolean;
  inspiredItems: InspiredItem[];
  // 「この作品からインスパイアされた投稿」でProjectカード(WorkCard)を
  // そのまま再利用するために必要な、フィードと同じ形の付随データ。
  posts: Post[];
  inspiredMyReactions: Record<string, ReactionKey[]>;
  // 作者に自分がブロックされているかどうか。trueならリアクション/
  // リポスト/コメントのUIを出さない(サーバー側でも別途拒否している、
  // これは無駄な操作を先回りで防ぐためのもの)。
  blockedByAuthor: boolean;
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
          {work.authorId === currentUserId ? (
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
          ) : (
            <MoreActionsMenu
              reportTarget={{ type: "project", id: work.id }}
              author={{ id: work.authorId ?? "", name: work.author }}
            />
          )}
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Link
            href={`/u/${encodeURIComponent(work.authorHandle ?? work.author)}`}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <AuthorAvatar name={work.author} image={work.authorImage} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[var(--ink)] hover:underline">
                {work.author}
                {work.authorHandle && (
                  <span className="ml-1 font-normal text-[var(--ink-faint)]">@{work.authorHandle}</span>
                )}
              </p>
              <p className="text-[12px] text-[var(--ink-faint)]">{formatPostedAgo(work.daysAgo)}に投稿</p>
            </div>
          </Link>
          {work.authorId !== currentUserId && (
            <FollowButton author={work.authorHandle ?? work.author} size="md" />
          )}
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

        {/* カバー画像がある場合、上の分岐でGitHubCardは表示されない
            (画像が優先される)。それだと編集で後からGitHub URLを追加/
            変更しても反映が確認できないため、画像がある場合でも下に
            小さめのカードで両方表示する。 */}
        {work.coverImageUrl && work.githubUrl && (
          <div className="mb-4">
            <p className="mb-2 text-[12px] font-medium text-[var(--ink-faint)]">リポジトリ</p>
            <GitHubCard githubUrl={work.githubUrl} size="md" />
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <StageBadge stage={work.stage} />
          <ToolBadge tool={work.tool} />
          <PlatformBadges platforms={work.platforms} />
        </div>

        <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-bold leading-snug text-[var(--ink)]">
          {work.title}
        </h1>
        {work.inspiredByProjectId && work.inspiredByProjectTitle && (
          <Link
            href={`/work/${work.inspiredByProjectId}`}
            className="mb-2 inline-flex w-fit items-center gap-1 rounded-full border border-[var(--teal)] bg-[var(--teal-soft)] px-2.5 py-1 text-[12px] text-[var(--teal)] hover:underline"
          >
            🌱 {work.inspiredByProjectTitle} からインスパイア
          </Link>
        )}
        <p className="mb-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--ink-soft)]">{work.catch}</p>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {blockedByAuthor ? (
              <span className="text-[12px] text-[var(--ink-faint)]">
                この作品の作者にブロックされているため、反応できません
              </span>
            ) : (
              <>
                <ReactionBar workId={work.id} reactions={work.reactions} myReactions={myReactions} />
                <RepostButton projectId={work.id} count={work.reposts} size="md" allowQuote />
              </>
            )}
            <Link
              href={`/?inspiredById=${work.id}&inspiredByTitle=${encodeURIComponent(work.title)}#composer`}
              className="inline-flex w-fit items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
            >
              🌱 これにインスパイアされて投稿する
            </Link>
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
                {work.authorId === currentUserId ? (
                  <PostEditor
                    postId={post.id}
                    body={post.body}
                    bodyClassName="text-[14px] leading-relaxed text-[var(--ink)]"
                  />
                ) : (
                  post.body && <p className="text-[14px] leading-relaxed text-[var(--ink)]">{post.body}</p>
                )}
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
                  target={{ type: "project", id: work.id }}
                  currentUserId={currentUserId}
                  isLoggedIn={isLoggedIn}
                />
              ))
            )}
          </div>
          {blockedByAuthor ? (
            <p className="text-[13px] text-[var(--ink-faint)]">
              この作品の作者にブロックされているため、コメントできません
            </p>
          ) : (
            <CommentForm target={{ type: "project", id: work.id }} isLoggedIn={isLoggedIn} />
          )}
        </div>

        <div className="mb-6">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
            この作品からインスパイアされた投稿({inspiredItems.length})
          </h2>
          {inspiredItems.length === 0 ? (
            <p className="text-[13px] text-[var(--ink-faint)]">まだインスパイアされた投稿はありません</p>
          ) : (
            <div className="flex flex-col gap-3">
              {inspiredItems.map((item) =>
                item.kind === "project" ? (
                  <WorkCard
                    key={`project-${item.work.id}`}
                    work={item.work}
                    posts={posts}
                    myReactions={inspiredMyReactions}
                    currentUserId={currentUserId}
                    showAnchor={false}
                  />
                ) : (
                  <StandalonePostCard key={`post-${item.post.id}`} post={item.post} />
                ),
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <p className="mb-2 text-[12px] font-medium text-[var(--ink-faint)]">この作品を共有</p>
          <ShareButtons title={work.title} />
        </div>
      </main>
    </div>
  );
}
