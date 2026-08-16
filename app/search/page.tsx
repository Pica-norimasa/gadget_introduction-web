import type { Metadata } from "next";
import { getMyReactions, getPosts, searchStandalonePosts, searchWorks } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { StandalonePostCard } from "@/app/components/StandalonePostCard";
import { WorkCard } from "@/app/components/WorkCard";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  return { title: query ? `「${query}」の検索結果 | Draftly` : "検索 | Draftly" };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [works, standalonePosts, posts, myReactions, currentUser] = await Promise.all([
    searchWorks(query),
    searchStandalonePosts(query),
    getPosts(),
    getMyReactions(),
    getCurrentUser(),
  ]);
  const totalCount = works.length + standalonePosts.length;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader defaultQuery={query} />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 sm:px-6">
        {query ? (
          <>
            <h1 className="mb-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
              「{query}」の検索結果
            </h1>
            <p className="mb-6 text-[13px] text-[var(--ink-faint)]">{totalCount}件見つかりました</p>
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
        ) : totalCount === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-faint)]">
            「{query}」に一致する結果は見つかりませんでした
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {works.length > 0 && (
              <div>
                <h2 className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
                  作品({works.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {works.map((w) => (
                    <WorkCard
                      key={w.id}
                      work={w}
                      posts={posts}
                      myReactions={myReactions}
                      currentUserId={currentUser?.id ?? null}
                      showAnchor={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {standalonePosts.length > 0 && (
              <div>
                <h2 className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
                  つぶやき({standalonePosts.length})
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {standalonePosts.map((p) => (
                    <StandalonePostCard key={p.id} post={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
