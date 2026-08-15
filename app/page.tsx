import { buildLogFeed, works } from "@/app/lib/mock-data";
import { SiteHeader } from "@/app/components/SiteHeader";
import { StoriesStrip } from "@/app/components/StoriesStrip";
import { HeroRail } from "@/app/components/HeroRail";
import { FeedSection } from "@/app/components/FeedSection";
import { Sidebar } from "@/app/components/Sidebar";
import { DiceButton } from "@/app/components/DiceButton";

export default function Home() {
  const heroWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 6);
  const rankingWorks = [...works].sort((a, b) => b.trendScore - a.trendScore).slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="flex-1">
        <StoriesStrip buildLogs={buildLogFeed} works={works} />
        <HeroRail works={heroWorks} />

        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_300px]">
          <FeedSection works={works} />
          <Sidebar ranking={rankingWorks} buildLogs={buildLogFeed} />
        </div>
      </main>

      <footer className="border-t border-[var(--line)] px-4 py-8 text-center text-[12px] text-[var(--ink-faint)] sm:px-6">
        きざし — アイデアを、育てながら見せる場所。掲載中のデータはすべてモックです。
      </footer>

      <DiceButton works={works} />
    </div>
  );
}
