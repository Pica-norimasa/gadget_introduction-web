import Link from "next/link";
import type { ReactNode } from "react";
import type { Post, ReactionKey, Work } from "@/app/lib/mock-data";
import type { CommentThread as CommentThreadType, InspiredItem } from "@/app/lib/queries";
import { formatCount, formatPostedAgo } from "@/app/lib/format";
import { AiCommentsToggle } from "./AiCommentsToggle";
import { AuthorAvatar } from "./AuthorAvatar";
import { BookmarkButton } from "./BookmarkButton";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import { CoverImage } from "./CoverImage";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { FollowButton } from "./FollowButton";
import { GitHubCard } from "./GitHubCard";
import { LinkifiedText } from "./LinkifiedText";
import { MotionThumb } from "./MotionThumb";
import { VerifiedBadge } from "./VerifiedBadge";
import { PlatformBadges } from "./PlatformBadges";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { AndroidMark, AppleMark } from "./PlatformIcons";
import { ProjectTimelineList } from "./ProjectTimelineList";
import { ReactionBar } from "./ReactionBar";
import { RepostButton } from "./RepostButton";
import { ShareButtons } from "./ShareButtons";
import { SiteHeader } from "./SiteHeader";
import { StageBadge } from "./StageBadge";
import { StandalonePostCard } from "./StandalonePostCard";
import { TrackedExternalLink } from "./TrackedExternalLink";
import { TrackedLink } from "./TrackedLink";
import { PostForm } from "./PostForm";
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
  initialTab,
  relatedWorks,
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
  // PostForm(variant="timeline"、作者本人にしか出ないが、その作者が
  // ゲストのこともある)向け。同じくログイン済みの場合は無視される。
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
  // 通知(NotificationBell.tsx)の?tab=クエリから渡される、開いた直後に
  // 表示したいタブ("comments"等)。未指定なら従来通り制作タイムライン。
  initialTab?: string;
  // 同じtool/対応環境の他作品(getRelatedWorks()参照)。検索流入者が
  // この作品だけ見て離脱せず、Draftly内を回遊してもらうための導線。
  relatedWorks: Work[];
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

        {work.authorId === currentUserId && (
          <div className="mb-5 flex justify-end">
            <DeleteProjectButton projectId={work.id} />
          </div>
        )}

        <div className="mb-5 flex items-center gap-2.5">
          <TrackedLink
            href={`/u/${encodeURIComponent(work.authorHandle ?? work.author)}`}
            trackType="profile_click"
            trackTarget={work.authorHandle ?? work.author}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <AuthorAvatar name={work.author} image={work.authorImage} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-[var(--ink)] hover:underline">
                {work.author}
                {work.authorVerified && <VerifiedBadge className="ml-1 inline-block align-[-1px]" />}
                {work.authorSocialHandle && (
                  <span className="ml-1 font-normal text-[var(--ink-faint)]">@{work.authorSocialHandle}</span>
                )}
              </p>
              <p className="text-[12px] text-[var(--ink-faint)]">{formatPostedAgo(work.daysAgo)}に投稿</p>
            </div>
          </TrackedLink>
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
                <TrackedExternalLink
                  href={work.appStoreUrl}
                  type="external_link_appstore"
                  title="App Store"
                  ariaLabel="App Store"
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
                >
                  <AppleMark className="h-4 w-4" />
                </TrackedExternalLink>
              )}
              {work.googlePlayUrl && (
                <TrackedExternalLink
                  href={work.googlePlayUrl}
                  type="external_link_googleplay"
                  title="Google Play"
                  ariaLabel="Google Play"
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
                >
                  <AndroidMark className="h-4 w-4" />
                </TrackedExternalLink>
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
          {work.tool ? (
            <TrackedLink href={`/tool/${work.tool}`} trackType="tool_badge_click" trackTarget={work.tool}>
              <ToolBadge tool={work.tool} />
            </TrackedLink>
          ) : (
            <ToolBadge tool={work.tool} />
          )}
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

        <div className="mb-7 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[var(--ink)]">この作品でできること</p>
              <p className="mt-0.5 text-[12px] text-[var(--ink-faint)]">
                反応する、広める、あとで見る、インスパイアされて投稿する
              </p>
            </div>
            <BookmarkButton
              target={{ type: "project", id: work.id }}
              bookmarked={work.bookmarked ?? false}
              size="md"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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
              className="inline-flex w-fit items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--accent)]"
            >
              これにインスパイアされて投稿
            </Link>
          </div>

          <div className="mt-4 border-t border-[var(--line)] pt-4">
            <p className="mb-3 text-[12px] font-medium text-[var(--ink-faint)]">共有する</p>
            <ShareButtons title={work.title} />
          </div>
        </div>

        {/* 制作タイムライン・コメント・「この作品からインスパイアされた投稿」を
            縦積みのままにすると、上のものが伸びるほど下のものが埋もれて
            書き込み・閲覧しづらくなる(共有ボタンの位置を移動したのと同じ
            経緯)ため、タブで別ペインに切り出した(WorkMediaTabs.tsxを
            画像/GitHub/YouTube切り替えと同じ用途で流用)。 */}
        <WorkMediaTabs
          initialTabId={initialTab}
          tabs={[
            {
              id: "timeline",
              label: "制作タイムライン",
              content: (
                <div className="mb-6">
                  <ProjectTimelineList timeline={timeline} isOwner={work.authorId === currentUserId} />
                  {work.authorId === currentUserId && (
                    <div className="mt-4">
                      <PostForm variant="timeline" projectId={work.id} isLoggedIn={isLoggedIn} guestPostCount={guestPostCount} />
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
                  <CommentList
                    comments={comments}
                    target={{ type: "project", id: work.id }}
                    currentUserId={currentUserId}
                    isLoggedIn={isLoggedIn}
                    guestCommentCount={guestCommentCount}
                    contentAuthorId={work.authorId ?? ""}
                  />
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
            ...(relatedWorks.length > 0
              ? [
                  {
                    id: "related",
                    label: "関連作品",
                    content: (
                      <div className="mb-6 flex flex-col gap-3.5">
                        {relatedWorks.map((relatedWork) => (
                          <WorkCard
                            key={relatedWork.id}
                            work={relatedWork}
                            posts={posts}
                            myReactions={inspiredMyReactions}
                            currentUserId={currentUserId}
                            showAnchor={false}
                          />
                        ))}
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </main>
    </div>
  );
}
