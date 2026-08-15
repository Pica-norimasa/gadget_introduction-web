import Link from "next/link";
import { latestUpdateFor, type Work } from "@/app/lib/mock-data";
import { AuthorAvatar } from "./AuthorAvatar";
import { ExpandableText } from "./ExpandableText";
import { FollowButton } from "./FollowButton";
import { GitHubCard } from "./GitHubCard";
import { MotionThumb } from "./MotionThumb";
import { PlatformBadges } from "./PlatformBadges";
import { ReactionBar } from "./ReactionBar";
import { StageBadge } from "./StageBadge";
import { ToolBadge } from "./ToolBadge";
import { WorkThumb } from "./WorkThumb";

function isUnderdog(w: Work) {
  return w.followers < 50 && w.trendScore >= 70;
}

function formatRelativeHours(hoursAgo: number): string {
  if (hoursAgo < 24) return `${hoursAgo}時間前`;
  return `${Math.round(hoursAgo / 24)}日前`;
}

function formatPostedAgo(daysAgo: number): string {
  if (daysAgo === 0) return "今日";
  return `${daysAgo}日前`;
}

export function WorkCard({
  work,
  size = "md",
  showAnchor = true,
}: {
  work: Work;
  size?: "md" | "lg";
  // 同じ作品がヒーローレールとフィードの両方に出ることがあるため、
  // id="work-xxx" を持つインスタンスは1つ(フィード側)だけにする。
  // ヒーロー側はshowAnchor={false}で渡し、id重複とアンカー先の
  // 不定挙動を防ぐ。
  showAnchor?: boolean;
}) {
  const update = latestUpdateFor(work.id);

  return (
    <article
      id={showAnchor ? `work-${work.id}` : undefined}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 shadow-[0_1px_2px_var(--shadow)] transition-shadow hover:shadow-[0_6px_20px_var(--shadow)] scroll-mt-24 target:ring-2 target:ring-[var(--accent)]"
    >
      <div className="mb-2 flex items-center gap-2">
        <AuthorAvatar name={work.author} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[var(--ink)]">{work.author}</p>
          <p className="text-[11px] text-[var(--ink-faint)]">{formatPostedAgo(work.daysAgo)}</p>
        </div>
        <FollowButton author={work.author} />
      </div>

      <div className="relative">
        {!work.glyph && work.githubUrl ? (
          <GitHubCard githubUrl={work.githubUrl} size={size} />
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
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-ink)]">
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

        {update && (
          <div
            className={`flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] leading-snug ${
              update.hoursAgo < 24 ? "bg-[var(--teal-soft)]" : "bg-[var(--bg-sunken)]"
            }`}
          >
            <span
              className={`shrink-0 font-mono font-medium ${
                update.hoursAgo < 24 ? "text-[var(--teal)]" : "text-[var(--ink-faint)]"
              }`}
            >
              🔄{formatRelativeHours(update.hoursAgo)}更新
            </span>
            <span className="line-clamp-1 text-[var(--ink-soft)]">{update.note}</span>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <ReactionBar workId={work.id} reactions={work.reactions} />
          <div className="flex items-center justify-between text-[12px] text-[var(--ink-faint)]">
            <Link href={`/work/${work.id}`} className="hover:text-[var(--ink-soft)] hover:underline">
              🔗 詳細・共有
            </Link>
            <span className="font-mono">💬{work.comments}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
