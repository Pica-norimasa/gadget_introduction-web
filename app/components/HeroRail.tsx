import type { Post, ReactionKey, Work } from "@/app/lib/mock-data";
import { WorkCard } from "./WorkCard";

export function HeroRail({
  works,
  posts,
  myReactions,
  currentUserId,
}: {
  works: Work[];
  posts: Post[];
  myReactions: Record<string, ReactionKey[]>;
  currentUserId: string | null;
}) {
  return (
    <section className="mx-auto max-w-[1180px] px-4 pt-8 sm:px-6">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
            Today&apos;s find
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
            今日の掘り出し物
          </h2>
        </div>
        <p className="hidden text-sm text-[var(--ink-faint)] sm:block">
          まだ知られていない作品を、運営とアルゴリズムでピックアップ
        </p>
      </div>

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 [scrollbar-width:thin]">
        {works.map((w) => (
          <div key={w.id} className="w-[260px] shrink-0">
            <WorkCard
              work={w}
              posts={posts}
              myReactions={myReactions}
              currentUserId={currentUserId}
              size="lg"
              showAnchor={false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
