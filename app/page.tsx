import { getMyReactions, getPosts, getWorks } from "@/app/lib/queries";
import { GUEST_USER_NAME } from "@/app/lib/guest-user";
import { SiteHeader } from "@/app/components/SiteHeader";
import { PostComposer } from "@/app/components/PostComposer";
import { RecentActivity } from "@/app/components/RecentActivity";
import { StoriesStrip } from "@/app/components/StoriesStrip";
import { ImmersiveEntry } from "@/app/components/ImmersiveEntry";
import { HeroRail } from "@/app/components/HeroRail";
import { FeedSection } from "@/app/components/FeedSection";
import { Sidebar } from "@/app/components/Sidebar";
import { DiceButton } from "@/app/components/DiceButton";

export default async function Home() {
  const [works, posts, myReactions] = await Promise.all([getWorks(), getPosts(), getMyReactions()]);
  const heroWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 6);
  const rankingWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 5);
  const myProjects = works.filter((w) => w.author === GUEST_USER_NAME);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="flex-1">
        <PostComposer myProjects={myProjects} />
        <RecentActivity />
        <StoriesStrip posts={posts} works={works} />
        <ImmersiveEntry works={works} posts={posts} myReactions={myReactions} />
        <HeroRail works={heroWorks} posts={posts} myReactions={myReactions} />

        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_300px]">
          <FeedSection works={works} posts={posts} myReactions={myReactions} />
          <Sidebar ranking={rankingWorks} posts={posts} works={works} />
        </div>
      </main>

      <footer className="border-t border-[var(--line)] px-4 py-8 text-center text-[12px] text-[var(--ink-faint)] sm:px-6">
        きざし — アイデアを、育てながら見せる場所。開発中のプロトタイプです。
      </footer>

      <DiceButton works={works} />
    </div>
  );
}
