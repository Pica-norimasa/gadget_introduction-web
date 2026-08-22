import type { Metadata } from "next";
import Link from "next/link";
import { getMyReactions, getPosts, searchByHashtag } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { StandalonePostCard } from "@/app/components/StandalonePostCard";
import { WorkCard } from "@/app/components/WorkCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const title = `#${decoded}`;
  const description = `Draftlyで「#${decoded}」が付いた作品・投稿をまとめて見る`;

  return {
    title: `${title} | Draftly`,
    description,
    openGraph: { title, description, type: "website", siteName: "Draftly" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);

  const [{ works, posts: standalonePosts }, posts, myReactions, currentUser] = await Promise.all([
    searchByHashtag(tag),
    getPosts(),
    getMyReactions(),
    getCurrentUser(),
  ]);
  const totalCount = works.length + standalonePosts.length;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ← ホームに戻る
        </Link>

        <h1 className="mb-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
          #{tag}
        </h1>
        <p className="mb-6 text-[13px] text-[var(--ink-faint)]">{totalCount}件見つかりました</p>

        {totalCount === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-faint)]">
            「#{tag}」が付いた投稿は見つかりませんでした
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
