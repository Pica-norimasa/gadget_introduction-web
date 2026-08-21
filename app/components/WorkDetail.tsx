import Link from "next/link";
import type { ReactNode } from "react";
import { POST_TYPE_META, type Post, type ReactionKey, type Work } from "@/app/lib/mock-data";
import type { CommentThread as CommentThreadType, InspiredItem } from "@/app/lib/queries";
import { formatCount, formatPostedAgo, formatRelativeHours } from "@/app/lib/format";
import { AiCommentsToggle } from "./AiCommentsToggle";
import { AuthorAvatar } from "./AuthorAvatar";
import { CommentForm } from "./CommentForm";
import { CommentThread } from "./CommentThread";
import { CoverImage } from "./CoverImage";
import { FollowButton } from "./FollowButton";
import { GitHubCard } from "./GitHubCard";
import { LinkifiedText } from "./LinkifiedText";
import { MotionThumb } from "./MotionThumb";
import { PlatformBadges } from "./PlatformBadges";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { AndroidMark, AppleMark } from "./PlatformIcons";
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
import { WorkMediaTabs } from "./WorkMediaTabs";
import { WorkThumb } from "./WorkThumb";
import { YouTubeCard } from "./YouTubeCard";

export function WorkDetail({
  work,
  timeline,
  myReactions,
  comments,
  currentUserId,
  isLoggedIn,
  guestCommentCount,
  guestPostCount,
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
  // コメント投稿は原則GitHub/Xログインが必須(荒らし対策)だが、
  // GUEST_COMMENT_LIMIT件までは未ログインでも投稿できる。閲覧・
  // リアクション等は引き続き匿名ゲストのままでも可能なので、
  // currentUserId(匿名ゲストも含む)とは別に持つ。
  isLoggedIn: boolean;
  // ログイン済みの場合は上限が無いので無視される。
  guestCommentCount: number;
  // TimelinePostForm(作者本人にしか出ないが、その作者がゲストのことも
  // ある)向け。同じくログイン済みの場合は無視される。
  guestPostCount: number;
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
  // 表紙画像・GitHub・YouTubeのうち設定されているものだけをタブとして
  // 並べる。2つ以上あるときだけWorkMediaTabsでタブ切り替えにし、1つだけ
  // ならタブを出さずそのまま表示する(0個ならglyph/motionのプレース
  // ホルダーにフォールバック、これは呼び出し側のJSXで扱う)。
  const mediaTabs: { id: string; label: string; content: ReactNode }[] = [
    ...(work.coverImageUrl ? [{ id: "image", label: "画像", content: <CoverImage src={work.coverImageUrl} size="lg" /> }] : []),
    ...(work.githubUrl ? [{ id: "github", label: "リポジトリ", content: <GitHubCard githubUrl={work.githubUrl} size="lg" /> }] : []),
    ...(work.youtubeUrl
      ? [{ id: "youtube", label: "動画", content: <YouTubeCard youtubeUrl={work.youtubeUrl} aspect="aspect-[4/3]" /> }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href={`/#work-${work.id}`}
            className="inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          >
            ← ホームに戻る
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

        <div className="mb-5 flex items-center gap-2.5">
          <Link
            href={`/u/${encodeURIComponent(work.authorHandle ?? work.author)}`}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <AuthorAvatar name={work.author} image={work.authorImage} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[var(--ink)] hover:underline">
                {work.author}
                {work.authorSocialHandle && (
                  <span className="ml-1 font-normal text-[var(--ink-faint)]">@{work.authorSocialHandle}</span>
                )}
              </p>
              <p className="text-[12px] text-[var(--ink-faint)]">{formatPostedAgo(work.daysAgo)}に投稿</p>
            </div>
          </Link>
          {work.authorId !== currentUserId && (
            <FollowButton author={work.authorHandle ?? work.author} size="md" />
          )}
        </div>

        <div className="relative mb-5">
          {mediaTabs.length === 0 ? (
            work.glyph && work.hasMotion ? (
              <MotionThumb hue={work.hue} glyph={work.glyph} size="lg" />
            ) : (
              <WorkThumb hue={work.hue} glyph={work.glyph} catchText={work.catch} size="lg" />
            )
          ) : mediaTabs.length === 1 ? (
            mediaTabs[0].content
          ) : (
            <WorkMediaTabs tabs={mediaTabs} />
          )}
          {(work.appStoreUrl || work.googlePlayUrl) && (
            <div className="absolute left-2 top-2 z-20 flex items-center gap-2">
              {work.appStoreUrl && (
                <a
                  href={work.appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="App Store"
                  aria-label="App Store"
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
                >
                  <AppleMark className="h-4 w-4" />
                </a>
              )}
              {work.googlePlayUrl && (
                <a
                  href={work.googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Google Play"
                  aria-label="Google Play"
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
                >
                  <AndroidMark className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
          {/* 右下はMotionThumbの「再生中/プレビュー」表示と被るため左下に置く(WorkCard.tsxと同じ配置) */}
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[11px] text-white">
            👁️{formatCount(work.views)} 💬{work.comments}
          </span>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <StageBadge stage={work.stage} />
          <ToolBadge tool={work.tool} />
          <PlatformBadges platforms={work.platforms} />
        </div>

        <h1 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold leading-snug text-[var(--ink)]">
          {work.title}
        </h1>
        {work.inspiredByProjectId && work.inspiredByProjectTitle && (
          <Link
            href={`/work/${work.inspiredByProjectId}`}
            className="mb-4 inline-flex w-fit items-center gap-1 rounded-full border border-[var(--teal)] bg-[var(--teal-soft)] px-2.5 py-1 text-[12px] text-[var(--teal)] hover:underline"
          >
            🌱 {work.inspiredByProjectTitle} からインスパイア
          </Link>
        )}
        <p className="mb-6 whitespace-pre-line text-[15px] leading-relaxed text-[var(--ink-soft)]">
          <LinkifiedText text={work.catch} />
        </p>

        <div className="mb-7 flex flex-wrap items-center gap-2.5">
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

        {/* 共有ボタンは元々一番下(タイムライン/コメント/インスパイアされた
            投稿という3つの際限なく伸びるセクションの後)にあったが、
            プロジェクトが育つほど埋もれて押されにくくなるという指摘を
            受けて、伸びる前のここ(タイムラインの直上)に移動した。 */}
        <div className="mb-7 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-6">
          <p className="mb-3 text-[12px] font-medium text-[var(--ink-faint)]">この作品を共有</p>
          <ShareButtons title={work.title} />
        </div>

        {/* 制作タイムライン・コメント・「この作品からインスパイアされた投稿」を
            縦積みのままにすると、上のものが伸びるほど下のものが埋もれて
            書き込み・閲覧しづらくなる(共有ボタンの位置を移動したのと同じ
            経緯)ため、タブで別ペインに切り出した(WorkMediaTabs.tsxを
            画像/GitHub/YouTube切り替えと同じ用途で流用)。 */}
        <WorkMediaTabs
          tabs={[
            {
              id: "timeline",
              label: "制作タイムライン",
              content: (
                <div className="mb-6">
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
                        <PostEditor
                          postId={post.id}
                          body={post.body}
                          imageUrl={post.imageUrl}
                          youtubeUrl={post.youtubeUrl}
                          isOwner={work.authorId === currentUserId}
                          bodyClassName="text-[14px] leading-relaxed text-[var(--ink)]"
                        />
                      </li>
                    ))}
                  </ol>
                  {work.authorId === currentUserId && (
                    <div className="mt-4">
                      <TimelinePostForm projectId={work.id} isLoggedIn={isLoggedIn} guestPostCount={guestPostCount} />
                    </div>
                  )}

                  {work.authorId === currentUserId && (
                    <div className="mt-4">
                      <AiCommentsToggle projectId={work.id} initialEnabled={work.aiCommentsEnabled ?? true} />
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: "comments",
              label: `コメント(${comments.reduce((sum, c) => sum + 1 + c.replies.length, 0)})`,
              content: (
                <div className="mb-6">
                  <div className="mb-4 flex flex-col gap-3.5">
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
                          guestCommentCount={guestCommentCount}
                        />
                      ))
                    )}
                  </div>
                  {blockedByAuthor ? (
                    <p className="text-[13px] text-[var(--ink-faint)]">
                      この作品の作者にブロックされているため、コメントできません
                    </p>
                  ) : (
                    <CommentForm
                      target={{ type: "project", id: work.id }}
                      isLoggedIn={isLoggedIn}
                      guestCommentCount={guestCommentCount}
                    />
                  )}
                </div>
              ),
            },
            {
              id: "inspired",
              label: `インスパイアされた投稿(${inspiredItems.length})`,
              content: (
                <div className="mb-6">
                  {inspiredItems.length === 0 ? (
                    <p className="text-[13px] text-[var(--ink-faint)]">まだインスパイアされた投稿はありません</p>
                  ) : (
                    <div className="flex flex-col gap-3.5">
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
              ),
            },
          ]}
        />
      </main>
    </div>
  );
}
