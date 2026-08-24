import {
  getDiscoveryPicks,
  getMyLikedPostIds,
  getMyPostCount,
  getMyReactions,
  getPosts,
  getRecentActivity,
  getRecentInspirations,
  getRecentReposts,
  getRecentStageUps,
  getRecentStandalonePosts,
  getSuggestedAuthors,
  getTickerActivity,
  getWorks,
} from "@/app/lib/queries";
import Link from "next/link";
import { auth } from "@/auth";
import { getCurrentUser } from "@/app/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { PostComposerToggle } from "@/app/components/PostComposerToggle";
import { StoriesStrip } from "@/app/components/StoriesStrip";
import { ImmersiveEntry } from "@/app/components/ImmersiveEntry";
import { HomeContentTabs } from "@/app/components/HomeContentTabs";
import { Sidebar } from "@/app/components/Sidebar";
import { StageUpCelebration } from "@/app/components/StageUpCelebration";
import { UpdatesTicker } from "@/app/components/UpdatesTicker";
import { HomePrimaryActions } from "@/app/components/HomePrimaryActions";

export default async function Home() {
  const [
    works,
    posts,
    myReactions,
    currentUser,
    activity,
    reposts,
    suggestedAuthors,
    standalonePosts,
    likedPostIds,
    inspirations,
    session,
    myPostCount,
    tickerActivity,
    stageUps,
  ] = await Promise.all([
    getWorks(),
    getPosts(),
    getMyReactions(),
    getCurrentUser(),
    getRecentActivity(),
    getRecentReposts(),
    getSuggestedAuthors(),
    getRecentStandalonePosts(),
    getMyLikedPostIds(),
    getRecentInspirations(),
    auth(),
    getMyPostCount(),
    getTickerActivity(),
    getRecentStageUps(),
  ]);
  // 「今日の掘り出し物」は素の人気順(rankingWorks)と別の並びにするため、
  // フォロワーの少ない作者を優先するgetDiscoveryPicks()を使う
  // (queries.tsのcomputeDiscoveryScore参照)。
  const discoveryWorks = getDiscoveryPicks(works, 6);
  const rankingWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 5);
  const myProjects = currentUser ? works.filter((w) => w.authorId === currentUser.id) : [];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />
      <UpdatesTicker activity={tickerActivity} />
      <StageUpCelebration items={stageUps} />

      <main className="flex-1">
        {/* 初見の訪問者(特に検索/SNS経由)が数秒で「何のサイトか」を理解できる
            ようにする一言。SNS的な機能(フォロー/つぶやき)は活かしつつ、
            「発見の場所」という価値をトップに明示する。ページ内で唯一の
            h1でもある(以前はh1が無かった、見出し構造のSEO対応も兼ねる)。 */}
        <div className="mx-auto max-w-[1180px] px-4 pt-7 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)] sm:text-[11px]">Discover</p>
          <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-[19px] font-bold leading-[1.45] text-[var(--ink)] sm:text-2xl sm:leading-snug">
            つくり手たちの面白いサービス・アプリ・ゲーム・アイディアを発見しよう
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-7 text-[var(--ink-soft)] sm:text-sm sm:leading-6">
            見るだけでも、作りかけを残すだけでも大丈夫。気になる作品を探すところから始められます。
          </p>
          <HomePrimaryActions />
        </div>

        <PostComposerToggle
          myProjects={myProjects}
          isLoggedIn={!!session?.user}
          guestPostCount={myPostCount}
        />

        <ImmersiveEntry works={works} posts={posts} myReactions={myReactions} currentUserId={currentUser?.id ?? null} />
        <StoriesStrip posts={posts} works={works} />
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_300px]">
          <HomeContentTabs
            works={works}
            posts={posts}
            myReactions={myReactions}
            currentUserId={currentUser?.id ?? null}
            reposts={reposts}
            inspirations={inspirations}
            discoveryWorks={discoveryWorks}
            standalonePosts={standalonePosts}
            likedPostIds={Array.from(likedPostIds)}
          />
          <div className="hidden lg:block">
            <Sidebar
              ranking={rankingWorks}
              posts={posts}
              works={works}
              activity={activity}
              myProjects={myProjects}
              currentUserName={currentUser?.name ?? null}
              reposts={reposts}
              suggestedAuthors={suggestedAuthors}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--line)] px-4 py-8 text-center text-[12px] text-[var(--ink-faint)] sm:px-6">
        <p>Draftly — アイデアを、育てながら見せる場所。開発中のプロトタイプです。</p>
        <p className="mt-2 flex items-center justify-center gap-3">
          <Link href="/terms" className="hover:text-[var(--ink-soft)] hover:underline">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-[var(--ink-soft)] hover:underline">
            プライバシーポリシー
          </Link>
        </p>
      </footer>
    </div>
  );
}
