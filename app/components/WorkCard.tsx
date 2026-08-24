import { POST_TYPE_META, type Post, type ReactionKey, type Work } from "@/app/lib/mock-data";
import { latestPostFor, latestYouTubePostFor } from "@/app/lib/post-helpers";
import { formatCount, formatPostedAgo, formatRelativeHours } from "@/app/lib/format";
import { GitHubMark } from "./BrandIcons";
import { AndroidMark, AppleMark } from "./PlatformIcons";
import { AuthorAvatar } from "./AuthorAvatar";
import { BookmarkButton } from "./BookmarkButton";
import { CoverImage } from "./CoverImage";
import { ExpandableText } from "./ExpandableText";
import { FollowButton } from "./FollowButton";
import { GitHubCard } from "./GitHubCard";
import { MotionThumb } from "./MotionThumb";
import { PlatformBadges } from "./PlatformBadges";
import { ReactionBar } from "./ReactionBar";
import { RepostButton } from "./RepostButton";
import { StageBadge } from "./StageBadge";
import { ToolBadge } from "./ToolBadge";
import { TrackedLink } from "./TrackedLink";
import { VerifiedBadge } from "./VerifiedBadge";
import { WorkThumb } from "./WorkThumb";
import { YouTubeCard } from "./YouTubeCard";

function isUnderdog(w: Work) {
  return w.followers < 50 && w.trendScore >= 70;
}

export function WorkCard({
  work,
  posts,
  myReactions,
  currentUserId,
  size = "md",
  variant = "grid",
  showAnchor = true,
}: {
  work: Work;
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
  currentUserId: string | null;
  size?: "md" | "lg";
  variant?: "grid" | "horizontal";
  // 同じ作品がヒーローレールとフィードの両方に出ることがあるため、
  // id="work-xxx" を持つインスタンスは1つ(フィード側)だけにする。
  // ヒーロー側はshowAnchor={false}で渡し、id重複とアンカー先の
  // 不定挙動を防ぐ。
  showAnchor?: boolean;
}) {
  const latestPost = latestPostFor(work.id, posts);
  const latestYouTubePost = latestYouTubePostFor(work.id, posts);
  const mediaYouTubeUrl = work.youtubeUrl ?? latestYouTubePost?.youtubeUrl;
  const horizontal = variant === "horizontal";
  const mediaSize = horizontal ? "lg" : size;

  const authorHeader = (
    <div className={horizontal ? "mb-3 flex items-center gap-2" : "mb-3 flex items-center gap-2"}>
      <TrackedLink
        href={`/u/${encodeURIComponent(work.authorHandle ?? work.author)}`}
        trackType="profile_click"
        trackTarget={work.authorHandle ?? work.author}
        className="relative z-20 flex min-w-0 flex-1 items-center gap-2"
      >
        <AuthorAvatar name={work.author} image={work.authorImage} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[var(--ink)] hover:underline">
            {work.author}
            {work.authorVerified && <VerifiedBadge className="ml-1 inline-block align-[-1px]" />}
            {work.authorSocialHandle && (
              <span className="ml-1 font-normal text-[var(--ink-faint)]">@{work.authorSocialHandle}</span>
            )}
          </p>
          <p className="truncate text-[11px] text-[var(--ink-faint)]">
            最終更新: {formatPostedAgo(work.lastActivityDaysAgo ?? work.daysAgo)}
          </p>
        </div>
      </TrackedLink>
      {work.authorId !== currentUserId && (
        <div className="relative z-20">
          <FollowButton author={work.authorHandle ?? work.author} />
        </div>
      )}
    </div>
  );

  // GitHubCard自体がサムネイルとして出ているときは、下のバッジで
  // 二重にGitHubを案内する必要が無い(coverImage/YouTube/glyphのいずれか
  // が優先されているときだけ、githubUrlの存在を小さいバッジで示す)。
  const showsGitHubBadge = Boolean(work.githubUrl) && Boolean(work.coverImageUrl || mediaYouTubeUrl || work.glyph);

  const media = (
    <div className="relative">
      {work.coverImageUrl ? (
        <CoverImage src={work.coverImageUrl} size={mediaSize} />
      ) : mediaYouTubeUrl ? (
        <div className="relative z-20">
          <YouTubeCard
            youtubeUrl={mediaYouTubeUrl}
            aspect={mediaSize === "lg" ? "aspect-[4/3]" : "aspect-square"}
          />
        </div>
      ) : !work.glyph && work.githubUrl ? (
        <div className="relative z-20">
          <GitHubCard githubUrl={work.githubUrl} size={mediaSize} />
        </div>
      ) : work.glyph && work.hasMotion ? (
        <MotionThumb hue={work.hue} glyph={work.glyph} size={mediaSize} />
      ) : (
        <WorkThumb hue={work.hue} glyph={work.glyph} title={work.title} catchText={work.catch} size={mediaSize} />
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
              className="grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
            >
              <AppleMark className="h-3.5 w-3.5" />
            </a>
          )}
          {work.googlePlayUrl && (
            <a
              href={work.googlePlayUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Google Play"
              aria-label="Google Play"
              className="grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
            >
              <AndroidMark className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
      <div className="absolute right-2 top-2 z-20 flex items-center gap-2">
        {work.trendScore >= 70 && (
          <span className="group/trend relative">
            <span
              aria-label="急上昇"
              className="grid h-6 w-6 place-items-center rounded-full bg-[var(--ink)] text-[12px]"
            >
              🔥
            </span>
            <span className="pointer-events-none absolute right-0 top-full z-30 mt-1 w-max max-w-[160px] scale-95 rounded-lg bg-[var(--ink)] px-2 py-1 text-[11px] leading-snug text-[var(--bg)] opacity-0 shadow-[0_4px_12px_var(--shadow)] transition-all group-hover/trend:scale-100 group-hover/trend:opacity-100">
              反応が伸びていて、今注目されている作品です
            </span>
          </span>
        )}
        {isUnderdog(work) && (
          <span className="group/underdog relative">
            <span
              aria-label="無名の逆転枠"
              className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-soft)] text-[13px] text-[var(--accent)]"
            >
              💎
            </span>
            <span className="pointer-events-none absolute right-0 top-full z-30 mt-1 w-max max-w-[160px] scale-95 rounded-lg bg-[var(--ink)] px-2 py-1 text-[11px] leading-snug text-[var(--bg)] opacity-0 shadow-[0_4px_12px_var(--shadow)] transition-all group-hover/underdog:scale-100 group-hover/underdog:opacity-100">
              フォロワーが少ないのに注目されている、掘り出し物枠です
            </span>
          </span>
        )}
      </div>
      {/* 右下はMotionThumbの「再生中/プレビュー」表示と被るため左下に置く */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[11px] text-white">
          👁️{formatCount(work.views)} 💬{work.comments}
        </span>
        {showsGitHubBadge && (
          <a
            href={work.githubUrl!}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHubリポジトリ"
            aria-label="GitHubリポジトリ"
            className="grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
          >
            <GitHubMark className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );

  const body = (
    <div className={horizontal ? "flex min-w-0 flex-1 flex-col gap-2.5 sm:gap-3" : "flex flex-1 flex-col gap-3 pt-4"}>
      <div>
        <h3 className="truncate font-[family-name:var(--font-display)] text-[14.5px] font-bold leading-snug text-[var(--ink)] decoration-[var(--ink-faint)] decoration-1 underline-offset-4 transition-[text-decoration-color] group-hover:underline sm:text-[16px]">
          {work.title}
        </h3>
        <ExpandableText text={work.catch} className="mt-1.5" compact />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <StageBadge stage={work.stage} />
        <ToolBadge tool={work.tool} />
        <PlatformBadges platforms={work.platforms} />
      </div>

      {latestPost && (
        <div className="w-full max-w-[22rem] rounded-2xl border border-[var(--line)] bg-[var(--bg-sunken)]/45 px-3 py-2 text-[11.5px] leading-snug">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--teal-soft)] px-2 py-0.5 font-medium text-[var(--teal)]">
              {POST_TYPE_META[latestPost.type].icon} {POST_TYPE_META[latestPost.type].label}
            </span>
            <span
              className={`shrink-0 font-mono font-medium ${
                latestPost.hoursAgo < 24 ? "text-[var(--teal)]" : "text-[var(--ink-faint)]"
              }`}
            >
              {formatRelativeHours(latestPost.hoursAgo)}
            </span>
          </div>
          <p className="mt-1 truncate text-[var(--ink-faint)]">制作タイムライン 最終更新</p>
        </div>
      )}

      <div className={horizontal ? "mt-auto flex flex-col gap-2 pt-2" : "flex flex-col gap-2 pt-3"}>
        <div className="relative z-20 flex flex-wrap items-center gap-2">
          <ReactionBar workId={work.id} reactions={work.reactions} myReactions={myReactions[work.id] ?? []} />
          <RepostButton projectId={work.id} />
          <BookmarkButton target={{ type: "project", id: work.id }} bookmarked={work.bookmarked ?? false} className="ml-auto" />
        </div>
      </div>
    </div>
  );

  return (
    <article
      id={showAnchor ? `work-${work.id}` : undefined}
      className={`group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3.5 shadow-[0_1px_2px_var(--shadow)] transition-colors hover:border-[var(--accent)] scroll-mt-24 sm:p-4 ${
        horizontal ? "" : "flex flex-col"
      }`}
    >
      {/* カード全体を詳細ページへのリンクにする(stretched link)。上に重なる
          FollowButton/ReactionBar/GitHubCardリンク/続きを読むボタンだけは
          relative z-20を付けて個別にクリックできるようにしている。 */}
      <TrackedLink
        href={`/work/${work.id}`}
        trackType="work_card_click"
        trackTarget={work.id}
        ariaLabel={work.title}
        className="absolute inset-0 z-10"
      />

      {horizontal ? (
        <div className="grid gap-3.5 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="min-w-0">{media}</div>
          <div className="min-w-0">
            {authorHeader}
            {body}
          </div>
        </div>
      ) : (
        <>
          {authorHeader}
          {media}
          {body}
        </>
      )}
    </article>
  );
}
