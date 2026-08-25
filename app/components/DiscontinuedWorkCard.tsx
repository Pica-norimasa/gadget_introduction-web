import Link from "next/link";
import type { Work } from "@/app/lib/mock-data";
import { AuthorAvatar } from "./AuthorAvatar";
import { StageBadge } from "./StageBadge";

// 「みんなの経験値」ページの「開発中止から得た学び」タブ専用。
// WorkCard.tsxは一覧向けの汎用カードでretrospectiveを出す場所が無いため、
// ここでは振り返り本文そのものを主役にした専用カードにする。
export function DiscontinuedWorkCard({ work }: { work: Work }) {
  return (
    <div className="relative flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 hover:border-[var(--accent)]">
      <Link href={`/work/${work.id}`} aria-label={work.title} className="absolute inset-0 z-10" />
      <AuthorAvatar name={work.author} image={work.authorImage} size={28} />
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--ink-faint)]">
          <span className="font-medium text-[var(--ink-soft)]">{work.author}</span>
          <span>・ {work.title}</span>
          <StageBadge stage={work.stage} />
        </p>
        {work.retrospective && (
          <p className="line-clamp-4 whitespace-pre-line text-[13px] leading-relaxed text-[var(--ink)]">
            {work.retrospective}
          </p>
        )}
      </div>
    </div>
  );
}
