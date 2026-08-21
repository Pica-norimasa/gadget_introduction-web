import Link from "next/link";
import { POST_TYPE_META, type Post, type ReactionKey, type Work } from "@/app/lib/mock-data";
import { latestPostFor } from "@/app/lib/post-helpers";
import { formatCount, formatPostedAgo, formatRelativeHours } from "@/app/lib/format";
import { AndroidMark, AppleMark } from "./PlatformIcons";
import { AuthorAvatar } from "./AuthorAvatar";
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
  showAnchor = true,
}: {
  work: Work;
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
  currentUserId: string | null;
  size?: "md" | "lg";
  // 同じ作品がヒーローレールとフィードの両方に出ることがあるため、
  // id="work-xxx" を持つインスタンスは1つ(フィード側)だけにする。
  // ヒーロー側はshowAnchor={false}で渡し、id重複とアンカー先の
  // 不定挙動を防ぐ。
  showAnchor?: boolean;
}) {
  const latestPost = latestPostFor(work.id, posts);

  return (
    <article
      id={showAnchor ? `work-${work.id}` : undefined}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 shadow-[0_1px_2px_var(--shadow)] transition-colors hover:border-[var(--accent)] scroll-mt-24 target:ring-2 target:ring-[var(--accent)]"
    >
      {/* カード全体を詳細ページへのリンクにする(stretched link)。上に重なる
          FollowButton/ReactionBar/GitHubCardリンク/続きを読むボタンだけは
          relative z-20を付けて個別にクリックできるようにしている。 */}
      <Link href={`/work/${work.id}`} aria-label={work.title} className="absolute inset-0 z-10" />

      <div className="mb-3 flex items-center gap-2">
        <Link
          href={`/u/${encodeURIComponent(work.authorHandle ?? work.author)}`}
          className="relative z-20 flex min-w-0 flex-1 items-center gap-2"
        >
          <AuthorAvatar name={work.author} image={work.authorImage} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[var(--ink)] hover:underline">
              {work.author}
              {work.authorSocialHandle && (
                <span className="ml-1 font-normal text-[var(--ink-faint)]">@{work.authorSocialHandle}</span>
              )}
            </p>
            <p className="truncate text-[11px] text-[var(--ink-faint)]">
              最終更新: {formatPostedAgo(work.lastActivityDaysAgo ?? work.daysAgo)}
            </p>
          </div>
        </Link>
        {work.authorId !== currentUserId && (
          <div className="relative z-20">
            <FollowButton author={work.authorHandle ?? work.author} />
          </div>
        )}
      </div>

      <div className="relative">
        {work.coverImageUrl ? (
          <CoverImage src={work.coverImageUrl} size={size} />
        ) : work.youtubeUrl ? (
          <div className="relative z-20">
            <YouTubeCard
              youtubeUrl={work.youtubeUrl}
              aspect={size === "lg" ? "aspect-[4/3]" : "aspect-square"}
            />
          </div>
        ) : !work.glyph && work.githubUrl ? (
          <div className="relative z-20">
            <GitHubCard githubUrl={work.githubUrl} size={size} />
          </div>
        ) : work.glyph && work.hasMotion ? (
          <MotionThumb hue={work.hue} glyph={work.glyph} size={size} />
        ) : (
          <WorkThumb hue={work.hue} glyph={work.glyph} catchText={work.catch} size={size} />
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
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[11px] text-white">
          👁️{formatCount(work.views)} 💬{work.comments}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={work.stage} />
          <ToolBadge tool={work.tool} />
          <PlatformBadges platforms={work.platforms} />
        </div>

        <h3 className="font-[family-name:var(--font-display)] text-[17px] font-bold leading-snug text-[var(--ink)]">
          {work.title}
        </h3>
        <ExpandableText text={work.catch} />

        {latestPost && (
          <div
            className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-[11.5px] leading-snug ${
              latestPost.hoursAgo < 24 ? "bg-[var(--teal-soft)]" : "bg-[var(--bg-sunken)]"
            }`}
          >
            <span
              className={`shrink-0 font-mono font-medium ${
                latestPost.hoursAgo < 24 ? "text-[var(--teal)]" : "text-[var(--ink-faint)]"
              }`}
            >
              {POST_TYPE_META[latestPost.type].icon}
              {formatRelativeHours(latestPost.hoursAgo)}・{POST_TYPE_META[latestPost.type].label}
            </span>
            <span className="line-clamp-1 text-[var(--ink-soft)]">{latestPost.body}</span>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-3">
          <div className="relative z-20 flex flex-wrap items-center gap-2">
            <ReactionBar workId={work.id} reactions={work.reactions} myReactions={myReactions[work.id] ?? []} />
            <RepostButton projectId={work.id} count={work.reposts} />
          </div>
        </div>
      </div>
    </article>
  );
}
