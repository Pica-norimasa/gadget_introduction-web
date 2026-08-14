import type { Work } from "@/app/lib/mock-data";
import { GitHubCard } from "./GitHubCard";
import { PlatformBadges } from "./PlatformBadges";
import { StageBadge } from "./StageBadge";
import { ToolBadge } from "./ToolBadge";
import { WorkThumb } from "./WorkThumb";

function isUnderdog(w: Work) {
  return w.followers < 50 && w.trendScore >= 70;
}

export function WorkCard({ work, size = "md" }: { work: Work; size?: "md" | "lg" }) {
  const totalReactions =
    work.reactions.interesting + work.reactions.useful + work.reactions.idea + work.reactions.wantToTry;

  return (
    <article
      id={`work-${work.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 shadow-[0_1px_2px_var(--shadow)] transition-shadow hover:shadow-[0_6px_20px_var(--shadow)] scroll-mt-24 target:ring-2 target:ring-[var(--accent)]"
    >
      <div className="relative">
        {!work.glyph && work.githubUrl ? (
          <GitHubCard githubUrl={work.githubUrl} size={size} />
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
        <p className="line-clamp-2 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">{work.catch}</p>

        <div className="mt-auto flex items-center justify-between pt-2 text-[12px] text-[var(--ink-faint)]">
          <span>
            by <span className="text-[var(--ink-soft)]">{work.author}</span>
          </span>
          <span className="font-mono">
            💛{totalReactions} · 💬{work.comments}
          </span>
        </div>
      </div>
    </article>
  );
}
