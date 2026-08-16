import Link from "next/link";
import { POST_TYPE_META, type Post, type ReactionKey, type Work } from "@/app/lib/mock-data";
import { latestPostFor } from "@/app/lib/post-helpers";
import { formatCount, formatPostedAgo, formatRelativeHours } from "@/app/lib/format";
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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 shadow-[0_1px_2px_var(--shadow)] transition-shadow hover:shadow-[0_6px_20px_var(--shadow)] scroll-mt-24 target:ring-2 target:ring-[var(--accent)]"
    >
      {/* カード全体を詳細ページへのリンクにする(stretched link)。上に重なる
          FollowButton/ReactionBar/GitHubCardリンク/続きを読むボタンだけは
          relative z-20を付けて個別にクリックできるようにしている。 */}
      <Link href={`/work/${work.id}`} aria-label={work.title} className="absolute inset-0 z-10" />

      <div className="mb-2 flex items-center gap-2">
        <Link
          href={`/u/${encodeURIComponent(work.author)}`}
          className="relative z-20 flex min-w-0 flex-1 items-center gap-2"
        >
          <AuthorAvatar name={work.author} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[var(--ink)] hover:underline">{work.author}</p>
            <p className="text-[11px] text-[var(--ink-faint)]">{formatPostedAgo(work.daysAgo)}</p>
          </div>
        </Link>
        {work.authorId !== currentUserId && (
          <div className="relative z-20">
            <FollowButton author={work.author} />
          </div>
        )}
      </div>

      <div className="relative">
        {work.coverImageUrl ? (
          <CoverImage src={work.coverImageUrl} size={size} />
        ) : !work.glyph && work.githubUrl ? (
          <div className="relative z-20">
            <GitHubCard githubUrl={work.githubUrl} size={size} />
          </div>
        ) : work.glyph && work.hasMotion ? (
          <MotionThumb hue={work.hue} glyph={work.glyph} size={size} />
        ) : (
          <WorkThumb hue={work.hue} glyph={work.glyph} catchText={work.catch} size={size} />
        )}
        {work.trendScore >= 70 && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[11px] font-medium text-[var(--bg)]">
            🔥 急上昇
          </span>
        )}
        {isUnderdog(work) && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
            無名の逆転枠
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
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
            className={`flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] leading-snug ${
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

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div className="relative z-20 flex flex-wrap items-center gap-1.5">
            <ReactionBar workId={work.id} reactions={work.reactions} myReactions={myReactions[work.id] ?? []} />
            <RepostButton projectId={work.id} count={work.reposts} />
          </div>
          <div className="flex items-center justify-end text-[12px] text-[var(--ink-faint)]">
            <span className="font-mono">
              👁️{formatCount(work.views)} · 💬{work.comments}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
