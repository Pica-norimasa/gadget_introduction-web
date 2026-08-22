import type { Metadata } from "next";
import Link from "next/link";
import { getMyReactions, getNewWorks, getPosts, getRankedWorks } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SITE_URL } from "@/app/lib/email";
import { SiteHeader } from "@/app/components/SiteHeader";
import { WorkCard } from "@/app/components/WorkCard";
import { WorkMediaTabs } from "@/app/components/WorkMediaTabs";

// ランキングを検索エンジンからも辿れる独立ページとして持たせる
// (これまではSidebar.tsxのウィジェットとしてしか存在しなかった)。
// /tag/[tag]と同じくビルド時プリレンダー対象から明示的に外す
// (Dockerfileのビルド時DATABASE_URLはダミーの接続不能な値のため)。
export const dynamic = "force-dynamic";

const title = "人気・新着ランキング";
const description = "Draftlyで反応が集まっている作品・新しく公開された作品をまとめて見る";

export const metadata: Metadata = {
  title: `${title} | Draftly`,
  description,
  alternates: { canonical: `${SITE_URL}/ranking` },
  openGraph: { title, description, type: "website", siteName: "Draftly" },
  twitter: { card: "summary_large_image", title, description },
};

export default async function RankingPage() {
  const [rankedWorks, newWorks, posts, myReactions, currentUser] = await Promise.all([
    getRankedWorks(20),
    getNewWorks(20),
    getPosts(),
    getMyReactions(),
    getCurrentUser(),
  ]);

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

        <h1 className="mb-6 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">{title}</h1>

        <WorkMediaTabs
          tabs={[
            {
              id: "popular",
              label: "人気",
              content: (
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-3">
                  {rankedWorks.map((w) => (
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
              ),
            },
            {
              id: "new",
              label: "新着",
              content: (
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-3">
                  {newWorks.map((w) => (
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
              ),
            },
          ]}
        />
      </main>
    </div>
  );
}
