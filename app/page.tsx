import { getMyReactions, getPosts, getRecentActivity, getWorks } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { PostComposer } from "@/app/components/PostComposer";
import { StoriesStrip } from "@/app/components/StoriesStrip";
import { ImmersiveEntry } from "@/app/components/ImmersiveEntry";
import { HeroRail } from "@/app/components/HeroRail";
import { FeedSection } from "@/app/components/FeedSection";
import { Sidebar } from "@/app/components/Sidebar";
import { DiceButton } from "@/app/components/DiceButton";

export default async function Home() {
  const [works, posts, myReactions, currentUser, activity] = await Promise.all([
    getWorks(),
    getPosts(),
    getMyReactions(),
    getCurrentUser(),
    getRecentActivity(),
  ]);
  const heroWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 6);
  const rankingWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 5);
  const myProjects = currentUser ? works.filter((w) => w.authorId === currentUser.id) : [];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="flex-1">
        <PostComposer myProjects={myProjects} />
        <StoriesStrip posts={posts} works={works} />
        <ImmersiveEntry works={works} posts={posts} myReactions={myReactions} />
        <HeroRail
          works={heroWorks}
          posts={posts}
          myReactions={myReactions}
          currentUserId={currentUser?.id ?? null}
        />

        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_300px]">
          <FeedSection
            works={works}
            posts={posts}
            myReactions={myReactions}
            currentUserId={currentUser?.id ?? null}
          />
          <Sidebar ranking={rankingWorks} posts={posts} works={works} activity={activity} />
        </div>
      </main>

      <footer className="border-t border-[var(--line)] px-4 py-8 text-center text-[12px] text-[var(--ink-faint)] sm:px-6">
        きざし — アイデアを、育てながら見せる場所。開発中のプロトタイプです。
      </footer>

      <DiceButton works={works} />
    </div>
  );
}
