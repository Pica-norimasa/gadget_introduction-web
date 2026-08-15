import Link from "next/link";
import { latestUpdateFor, type Work } from "@/app/lib/mock-data";
import { AuthorAvatar } from "./AuthorAvatar";
import { GitHubCard } from "./GitHubCard";
import { MotionThumb } from "./MotionThumb";
import { PlatformBadges } from "./PlatformBadges";
import { ReactionBar } from "./ReactionBar";
import { ShareButtons } from "./ShareButtons";
import { SiteHeader } from "./SiteHeader";
import { StageBadge } from "./StageBadge";
import { ToolBadge } from "./ToolBadge";
import { WorkThumb } from "./WorkThumb";

function formatPostedAgo(daysAgo: number): string {
  if (daysAgo === 0) return "今日";
  return `${daysAgo}日前`;
}

function formatRelativeHours(hoursAgo: number): string {
  if (hoursAgo < 24) return `${hoursAgo}時間前`;
  return `${Math.round(hoursAgo / 24)}日前`;
}

export function WorkDetail({ work }: { work: Work }) {
  const update = latestUpdateFor(work.id);

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
          <AuthorAvatar name={work.author} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[var(--ink)]">{work.author}</p>
            <p className="text-[12px] text-[var(--ink-faint)]">{formatPostedAgo(work.daysAgo)}に投稿</p>
          </div>
        </div>

        <div className="mb-4">
          {!work.glyph && work.githubUrl ? (
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

        {update && (
          <div
            className={`mb-4 flex items-start gap-1.5 rounded-lg px-3 py-2 text-[12.5px] leading-snug ${
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
            <span className="text-[var(--ink-soft)]">{update.note}</span>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <ReactionBar workId={work.id} reactions={work.reactions} />
          <span className="font-mono text-[12px] text-[var(--ink-faint)]">💬{work.comments}</span>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <p className="mb-2 text-[12px] font-medium text-[var(--ink-faint)]">この作品を共有</p>
          <ShareButtons title={work.title} />
        </div>
      </main>
    </div>
  );
}
