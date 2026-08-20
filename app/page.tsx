import {
  getMyLikedPostIds,
  getMyPostCount,
  getMyReactions,
  getPosts,
  getRecentActivity,
  getRecentInspirations,
  getRecentReposts,
  getRecentStandalonePosts,
  getSuggestedAuthors,
  getWorks,
} from "@/app/lib/queries";
import Link from "next/link";
import { auth } from "@/auth";
import { getCurrentUser } from "@/app/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { PostComposerToggle } from "@/app/components/PostComposerToggle";
import { StoriesStrip } from "@/app/components/StoriesStrip";
import { ImmersiveEntry } from "@/app/components/ImmersiveEntry";
import { HeroRail } from "@/app/components/HeroRail";
import { MurmurStrip } from "@/app/components/MurmurStrip";
import { FeedSection } from "@/app/components/FeedSection";
import { Sidebar } from "@/app/components/Sidebar";
import { MobileSidebarDrawer } from "@/app/components/MobileSidebarDrawer";
import { DiceButton } from "@/app/components/DiceButton";

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
  ]);
  const heroWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 6);
  const rankingWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 5);
  const myProjects = currentUser ? works.filter((w) => w.authorId === currentUser.id) : [];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="flex-1">
        <PostComposerToggle
          myProjects={myProjects}
          isLoggedIn={!!session?.user}
          guestPostCount={myPostCount}
        />

        {/* 「プロダクトの作り方」ガイドは元々サイドバーにあったが、lg未満だと
            ドロワーの奥(🏆ボタンを押さないと出てこない)に入ってしまい、
            Xからの初見の非ログインユーザーに一番見てほしい導線が埋もれて
            いた。ここに小さなピルボタンとして複製し、常時見える位置に出す
            (lg以上はサイドバーに既にあるので重複させない)。投稿欄のすぐ下、
            スワイプで発見の直前という並びにしている。 */}
        <div className="mx-auto max-w-[1180px] px-4 pt-3 pb-5 sm:px-6 lg:hidden">
          <Link
            href="/guide/build"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
          >
            <span aria-hidden>🔧</span>
            プロダクトの作り方
            <span aria-hidden className="text-[var(--accent)]">
              →
            </span>
          </Link>
        </div>

        <ImmersiveEntry works={works} posts={posts} myReactions={myReactions} />
        <StoriesStrip posts={posts} works={works} />
        <HeroRail
          works={heroWorks}
          posts={posts}
          myReactions={myReactions}
          currentUserId={currentUser?.id ?? null}
        />
        <MurmurStrip posts={standalonePosts} likedPostIds={likedPostIds} />

        {/* サイドバー(ランキング・おすすめの作者等)はlg未満だとフィードの下に
            回り込む。フィードが無限スクロールで際限なく伸びるため、下まで
            スクロールさせて見せるのは事実上たどり着けず、アンカーリンクで
            ジャンプさせても着地点がずれる(ジャンプの最中に無限スクロールの
            IntersectionObserverが発火し、上にコンテンツが追加されて位置が
            狂う)。そのため、lg未満では右からスライドインするドロワーに
            同じSidebarをもう1つ描画して回避する(lg以上ではこちらを隠し、
            2カラム側だけを表示する)。 */}
        <MobileSidebarDrawer>
          <Sidebar
            ranking={rankingWorks}
            posts={posts}
            works={works}
            activity={activity}
            myProjects={myProjects}
            currentUserName={currentUser?.name ?? null}
            reposts={reposts}
            suggestedAuthors={suggestedAuthors}
            showRankingAnchor={false}
          />
        </MobileSidebarDrawer>

        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_300px]">
          <FeedSection
            works={works}
            posts={posts}
            myReactions={myReactions}
            currentUserId={currentUser?.id ?? null}
            reposts={reposts}
            inspirations={inspirations}
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

      <DiceButton works={works} />
    </div>
  );
}
