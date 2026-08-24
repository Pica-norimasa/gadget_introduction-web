import type { Metadata } from "next";
import Link from "next/link";
import { getMyReactions, getNewWorks, getPosts, getRankedWorks } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SITE_URL } from "@/app/lib/email";
import { SiteHeader } from "@/app/components/SiteHeader";
import { WorkCard } from "@/app/components/WorkCard";
import { WorkMediaTabs } from "@/app/components/WorkMediaTabs";
import type { Work } from "@/app/lib/mock-data";

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

function RankedList({
  works,
  posts,
  myReactions,
  currentUserId,
  emptyMessage,
}: {
  works: Work[];
  posts: Awaited<ReturnType<typeof getPosts>>;
  myReactions: Awaited<ReturnType<typeof getMyReactions>>;
  currentUserId: string | null;
  emptyMessage: string;
}) {
  if (works.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-raised)] p-8 text-center">
        <p className="text-sm font-medium text-[var(--ink-soft)]">{emptyMessage}</p>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--ink-faint)]">
          気になる作品を投稿したり、リアクションするとランキングが育っていきます。
        </p>
        <Link
          href="/?composer=1#composer"
          className="mt-4 inline-flex rounded-full border border-[var(--line)] px-3 py-1.5 text-[12px] text-[var(--ink-soft)] hover:border-[var(--accent)]"
        >
          投稿してみる
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {works.map((work, index) => (
        <div key={work.id} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <span className="font-mono text-[13px] font-semibold text-[var(--accent)]">#{index + 1}</span>
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>
          <WorkCard
            work={work}
            posts={posts}
            myReactions={myReactions}
            currentUserId={currentUserId}
            variant="horizontal"
            showAnchor={false}
          />
        </div>
      ))}
    </div>
  );
}

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

      <main className="mx-auto w-full max-w-[680px] flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/home"
          className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ← ホームに戻る
        </Link>

        <div className="mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">Ranking</p>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)] sm:text-2xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
            いま反応が集まっている作品と、新しく出てきた作品をまとめて見られます。
          </p>
        </div>

        <WorkMediaTabs
          tabs={[
            {
              id: "popular",
              label: "人気",
              content: (
                <div className="pt-2">
                  <p className="mb-4 text-[12px] leading-relaxed text-[var(--ink-faint)]">
                    閲覧・コメント・リアクションなど、反応が伸びている作品を優先して表示します。
                  </p>
                  <RankedList
                    works={rankedWorks}
                    posts={posts}
                    myReactions={myReactions}
                    currentUserId={currentUser?.id ?? null}
                    emptyMessage="まだ人気ランキングに表示できる作品がありません"
                  />
                </div>
              ),
            },
            {
              id: "new",
              label: "新着",
              content: (
                <div className="pt-2">
                  <p className="mb-4 text-[12px] leading-relaxed text-[var(--ink-faint)]">
                    最近公開・更新された作品から順に表示します。新しい個人開発を探す入口です。
                  </p>
                  <RankedList
                    works={newWorks}
                    posts={posts}
                    myReactions={myReactions}
                    currentUserId={currentUser?.id ?? null}
                    emptyMessage="まだ新着ランキングに表示できる作品がありません"
                  />
                </div>
              ),
            },
          ]}
        />
      </main>
    </div>
  );
}
