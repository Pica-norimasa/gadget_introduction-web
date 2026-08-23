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
    <section className="mx-auto max-w-[1180px] px-4 pt-[62px] sm:px-6">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {works.slice(0, 6).map((w) => (
          <WorkCard
            key={w.id}
            work={w}
            posts={posts}
            myReactions={myReactions}
            currentUserId={currentUserId}
            size="md"
            showAnchor={false}
          />
        ))}
      </div>
    </section>
  );
}
