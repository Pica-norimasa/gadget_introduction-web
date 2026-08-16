import {
  getMyLikedPostIds,
  getMyReactions,
  getPosts,
  getRecentActivity,
  getRecentReposts,
  getRecentStandalonePosts,
  getSuggestedAuthors,
  getWorks,
} from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { PostComposerToggle } from "@/app/components/PostComposerToggle";
import { StoriesStrip } from "@/app/components/StoriesStrip";
import { ImmersiveEntry } from "@/app/components/ImmersiveEntry";
import { HeroRail } from "@/app/components/HeroRail";
import { MurmurStrip } from "@/app/components/MurmurStrip";
import { FeedSection } from "@/app/components/FeedSection";
import { Sidebar } from "@/app/components/Sidebar";
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
  ]);
  const heroWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 6);
  const rankingWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 5);
  const myProjects = currentUser ? works.filter((w) => w.authorId === currentUser.id) : [];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="flex-1">
        <PostComposerToggle myProjects={myProjects} />
        <StoriesStrip posts={posts} works={works} />
        <ImmersiveEntry works={works} posts={posts} myReactions={myReactions} />
        <HeroRail
          works={heroWorks}
          posts={posts}
          myReactions={myReactions}
          currentUserId={currentUser?.id ?? null}
        />
        <MurmurStrip posts={standalonePosts} likedPostIds={likedPostIds} />

        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_300px]">
          <FeedSection
            works={works}
            posts={posts}
            myReactions={myReactions}
            currentUserId={currentUser?.id ?? null}
            reposts={reposts}
          />
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
      </main>

      <footer className="border-t border-[var(--line)] px-4 py-8 text-center text-[12px] text-[var(--ink-faint)] sm:px-6">
        Draftly — アイデアを、育てながら見せる場所。開発中のプロトタイプです。
      </footer>

      <DiceButton works={works} />
    </div>
  );
}
