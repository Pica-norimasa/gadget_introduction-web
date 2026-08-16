import type { Metadata } from "next";
import { getMyReactions, getPosts, searchWorks } from "@/app/lib/queries";
import { SiteHeader } from "@/app/components/SiteHeader";
import { WorkCard } from "@/app/components/WorkCard";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  return { title: query ? `「${query}」の検索結果 | きざし` : "検索 | きざし" };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [results, posts, myReactions] = await Promise.all([
    searchWorks(query),
    getPosts(),
    getMyReactions(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader defaultQuery={query} />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 sm:px-6">
        {query ? (
          <>
            <h1 className="mb-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
              「{query}」の検索結果
            </h1>
            <p className="mb-6 text-[13px] text-[var(--ink-faint)]">{results.length}件見つかりました</p>
          </>
        ) : (
          <h1 className="mb-6 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
            検索
          </h1>
        )}

        {!query ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-faint)]">
            キーワードを入力して作品を探してみてください
          </p>
        ) : results.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-faint)]">
            「{query}」に一致する作品は見つかりませんでした
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((w) => (
              <WorkCard key={w.id} work={w} posts={posts} myReactions={myReactions} showAnchor={false} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
