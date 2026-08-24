import Link from "next/link";
import type { ReactNode } from "react";
import type { Post, ReactionKey, Work } from "@/app/lib/mock-data";
import type { CommentThread as CommentThreadType, InspiredItem } from "@/app/lib/queries";
import { formatCount, formatPostedAgo } from "@/app/lib/format";
import { AiCommentsToggle } from "./AiCommentsToggle";
import { AuthorAvatar } from "./AuthorAvatar";
import { BackButton } from "./BackButton";
import { BookmarkButton } from "./BookmarkButton";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import { CoverImage } from "./CoverImage";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { FollowButton } from "./FollowButton";
import { GitHubCard } from "./GitHubCard";
import { LinkifiedText } from "./LinkifiedText";
import { MilestoneShareCard } from "./MilestoneShareCard";
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
import { WorkSectionJumpButton } from "./WorkSectionJumpButton";
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
  helpfulCounts,
  myHelpfulPostIds,
  experienceStats,
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
  // 「参考になった」リアクション(HelpfulButton.tsx)の表示用。postId→件数
  // /自分が押済みの投稿ID一覧、どちらもtimelineに含まれる投稿分のみ。
  helpfulCounts: Record<string, number>;
  myHelpfulPostIds: string[];
  // 「学び/失敗/成功」の集計(getProjectExperienceStats()参照)。
  experienceStats: Record<"failure" | "success" | "learning", number>;
}) {
  // Xシェア文(ShareButtons.tsx)の「最新の進捗」に使う。タイムラインが
  // 空(まだ最初の投稿しかない等)ならキャッチコピーにフォールバックする。
  const latestUpdateText = timeline[timeline.length - 1]?.body || work.catch;
  const latestYouTubePost = [...timeline].reverse().find((post) => post.youtubeUrl);
  const mediaYouTubeUrl = work.youtubeUrl ?? latestYouTubePost?.youtubeUrl;
  const commentCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);
  const isOwner = work.authorId === currentUserId;
  const totalHelpfulCount = Object.values(helpfulCounts).reduce((sum, n) => sum + n, 0);
  const canPostTimeline = isOwner || Boolean(currentUserId && work.members?.some((member) => member.id === currentUserId));
  const primaryExternalLink = work.appStoreUrl
    ? { href: work.appStoreUrl, label: "App Storeで見る", type: "external_link_appstore" as const }
    : work.googlePlayUrl
      ? { href: work.googlePlayUrl, label: "Google Playで見る", type: "external_link_googleplay" as const }
      : work.githubUrl
        ? { href: work.githubUrl, label: "GitHubを見る", type: "external_link_github" as const }
        : null;
  // 表紙画像・GitHub・YouTubeのうち設定されているものだけをタブとして
  // 並べる。2つ以上あるときだけWorkMediaTabsでタブ切り替えにし、1つだけ
  // ならタブを出さずそのまま表示する(0個ならglyph/motionのプレース
  // ホルダーにフォールバック、これは呼び出し側のJSXで扱う)。
  // 閲覧数/App Store等のバッジはカバー画像・プレースホルダー用の飾りで、
  // GitHub/YouTubeカードは自前のUIで埋まっているため重ねると衝突する
  // (GITHUB表示や⭐スター数と被る)。そのため画像系のcontentだけに
  // バッジを閉じ込め、タブ切り替え時に自動でオン/オフされるようにする。
  const mediaOverlayBadges = (
    <>
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
    </>
  );

  const mediaTabs: { id: string; label: string; content: ReactNode }[] = [
    ...(work.coverImageUrl
      ? [
          {
            id: "image",
            label: "画像",
            content: (
              <div className="relative">
                <CoverImage src={work.coverImageUrl} size="lg" />
                {mediaOverlayBadges}
              </div>
            ),
          },
        ]
      : []),
    ...(work.githubUrl ? [{ id: "github", label: "リポジトリ", content: <GitHubCard githubUrl={work.githubUrl} size="lg" /> }] : []),
    ...(mediaYouTubeUrl
      ? [{ id: "youtube", label: "動画", content: <YouTubeCard youtubeUrl={mediaYouTubeUrl} aspect="aspect-[4/3]" /> }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-7 flex items-center justify-between">
          <BackButton
            fallbackHref={`/home#work-${work.id}`}
            className="inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          />
          {isOwner ? (
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

        {isOwner && (
          <div className="mb-5 flex justify-end">
            <DeleteProjectButton projectId={work.id} />
          </div>
        )}

        <div className="mb-6 flex items-center gap-3">
          <TrackedLink
            href={`/u/${encodeURIComponent(work.authorHandle ?? work.author)}`}
            trackType="profile_click"
            trackTarget={work.authorHandle ?? work.author}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <AuthorAvatar name={work.author} image={work.authorImage} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-semibold text-[var(--ink)] hover:underline">
                {work.author}
                {work.authorVerified && <VerifiedBadge className="ml-1 inline-block align-[-1px]" />}
                {work.authorSocialHandle && (
                  <span className="ml-1 font-normal text-[var(--ink-faint)]">@{work.authorSocialHandle}</span>
                )}
              </p>
              <p className="mt-0.5 text-[12.5px] text-[var(--ink-faint)]">
                最終更新: {formatPostedAgo(work.lastActivityDaysAgo ?? work.daysAgo)}
              </p>
            </div>
          </TrackedLink>
          {!isOwner && (
            <FollowButton author={work.authorHandle ?? work.author} size="md" />
          )}
        </div>

        <div id="work-media" className="mb-6 scroll-mt-24">
          {mediaTabs.length === 0 ? (
            <div className="relative">
              {work.glyph && work.hasMotion ? (
                <MotionThumb hue={work.hue} glyph={work.glyph} size="lg" />
              ) : (
                <WorkThumb hue={work.hue} glyph={work.glyph} title={work.title} catchText={work.catch} size="lg" />
              )}
              {mediaOverlayBadges}
            </div>
          ) : mediaTabs.length === 1 ? (
            mediaTabs[0].content
          ) : (
            <WorkMediaTabs tabs={mediaTabs} />
          )}
        </div>

        <div className="mb-7 flex flex-wrap items-center gap-2.5">
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

        <h1 className="mb-4 font-[family-name:var(--font-display)] text-[27px] font-bold leading-[1.25] text-[var(--ink)] sm:text-3xl">
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
        <p className="mb-8 whitespace-pre-line text-[15.5px] leading-8 text-[var(--ink-soft)]">
          <LinkifiedText text={work.catch} />
        </p>

        <div className="mb-9 rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-[14px] font-semibold text-[var(--ink)]">この作品にできること</p>
            <p className="mt-1 text-[12.5px] leading-6 text-[var(--ink-faint)]">
              見る、反応する、コメントする、紹介する。気になった行動からどうぞ。
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {primaryExternalLink ? (
              <TrackedExternalLink
                href={primaryExternalLink.href}
                type={primaryExternalLink.type}
                className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-sunken)]/35 px-4 py-3 text-left text-[13px] text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
              >
                <span className="block min-w-0 flex-1 text-left">
                  <span className="block font-semibold text-[var(--ink)]">作品を見る</span>
                  <span className="mt-0.5 block text-[11.5px] text-[var(--ink-faint)]">{primaryExternalLink.label}</span>
                </span>
                <span className="shrink-0" aria-hidden>↗</span>
              </TrackedExternalLink>
            ) : (
              <WorkSectionJumpButton
                tabId="timeline"
                className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-sunken)]/35 px-4 py-3 text-left text-[13px] text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
              >
                <span className="block min-w-0 flex-1 text-left">
                  <span className="block font-semibold text-[var(--ink)]">制作を見る</span>
                  <span className="mt-0.5 block text-[11.5px] text-[var(--ink-faint)]">タイムラインを読む</span>
                </span>
                <span className="shrink-0" aria-hidden>↓</span>
              </WorkSectionJumpButton>
            )}

            <WorkSectionJumpButton
              tabId="comments"
              className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-sunken)]/35 px-4 py-3 text-left text-[13px] text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
            >
              <span className="block min-w-0 flex-1 text-left">
                <span className="block font-semibold text-[var(--ink)]">コメントする</span>
                <span className="mt-0.5 block text-[11.5px] text-[var(--ink-faint)]">{commentCount}件のコメント</span>
              </span>
              <span className="shrink-0" aria-hidden>💬</span>
            </WorkSectionJumpButton>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-sunken)]/25 p-3">
            <p className="mb-2 text-[12px] font-medium text-[var(--ink-faint)]">反応・保存・紹介</p>
            <div className="flex flex-wrap items-center gap-3">
            {blockedByAuthor ? (
              <span className="text-[12px] text-[var(--ink-faint)]">
                この作品の作者にブロックされているため、反応できません
              </span>
            ) : (
              <>
                <ReactionBar workId={work.id} reactions={work.reactions} myReactions={myReactions} />
                <RepostButton projectId={work.id} size="md" allowQuote />
              </>
            )}
            <BookmarkButton
              target={{ type: "project", id: work.id }}
              bookmarked={work.bookmarked ?? false}
              size="md"
            />
            <Link
              href={`/home?inspiredById=${work.id}&inspiredByTitle=${encodeURIComponent(work.title)}#composer`}
              className="inline-flex w-fit items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--accent)]"
            >
              これにインスパイアされて投稿
            </Link>
            </div>
          </div>

          <div className="mt-5 border-t border-[var(--line)] pt-5">
            <p className="mb-3 text-[12px] font-medium text-[var(--ink-faint)]">共有する</p>
            <ShareButtons title={work.title} stage={work.stage} daysAgo={work.daysAgo} latestUpdate={latestUpdateText} />
            {isOwner && (
              <MilestoneShareCard
                workId={work.id}
                title={work.title}
                stage={work.stage}
                views={work.views}
                totalReactions={
                  work.reactions.like + work.reactions.useful + work.reactions.idea + work.reactions.wantToTry
                }
                followers={work.followers}
                daysAgo={work.daysAgo}
              />
            )}
            {isOwner && totalHelpfulCount > 0 && (
              <p className="mt-3 text-[12px] text-[var(--ink-faint)]">
                💡 あなたの投稿が合計{totalHelpfulCount}人の経験値になりました
              </p>
            )}
          </div>
        </div>

        {work.stage === "開発中止" && work.retrospective && (
          <div className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--bg-sunken)]/40 p-4">
            <p className="mb-2 text-[13px] font-semibold text-[var(--ink-soft)]">📕 振り返り</p>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
              {work.retrospective}
            </p>
          </div>
        )}

        {/* 制作タイムライン・コメント・「この作品からインスパイアされた投稿」を
            縦積みのままにすると、上のものが伸びるほど下のものが埋もれて
            書き込み・閲覧しづらくなる(共有ボタンの位置を移動したのと同じ
            経緯)ため、タブで別ペインに切り出した(WorkMediaTabs.tsxを
            画像/GitHub/YouTube切り替えと同じ用途で流用)。 */}
        <div id="work-sections" className="scroll-mt-24">
          {work.members && work.members.length > 0 && (
            <div className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] px-4 py-3">
              <p className="mb-2 text-[12px] font-medium text-[var(--ink-faint)]">参加メンバー</p>
              <div className="flex flex-wrap gap-2">
                {work.members.map((member) => (
                  <TrackedLink
                    key={member.id}
                    href={`/u/${encodeURIComponent(member.name)}`}
                    trackType="profile_click"
                    trackTarget={member.name}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg-sunken)]/35 px-2.5 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--accent)]"
                  >
                    <AuthorAvatar name={member.displayName} image={member.image} size={20} />
                    <span>{member.displayName}</span>
                  </TrackedLink>
                ))}
              </div>
            </div>
          )}

          <WorkMediaTabs
          initialTabId={initialTab}
          switchEventName="draftly:work-section-tab"
          tabs={[
            {
              id: "timeline",
              label: "制作タイムライン",
              content: (
                <div className="mb-6">
                  <ProjectTimelineList
                    timeline={timeline}
                    isOwner={isOwner}
                    githubUrl={work.githubUrl}
                    helpfulCounts={helpfulCounts}
                    myHelpfulPostIds={myHelpfulPostIds}
                    experienceStats={experienceStats}
                  />
                  {canPostTimeline && (
                    <div className="mt-4">
                      <PostForm variant="timeline" projectId={work.id} isLoggedIn={isLoggedIn} guestPostCount={guestPostCount} />
                    </div>
                  )}

                  {isOwner && (
                    <div className="mt-4">
                      <AiCommentsToggle projectId={work.id} initialEnabled={work.aiCommentsEnabled ?? true} />
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: "comments",
              label: `コメント(${commentCount})`,
              content: (
                <div className="mb-6">
                  <CommentList
                    comments={comments}
                    target={{ type: "project", id: work.id }}
                    currentUserId={currentUserId}
                    isLoggedIn={isLoggedIn}
                    guestCommentCount={guestCommentCount}
                    contentAuthorId={work.authorId ?? ""}
                    contentMemberIds={work.members?.map((member) => member.id) ?? []}
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
        </div>
      </main>
    </div>
  );
}
