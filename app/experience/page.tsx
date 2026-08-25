import type { Metadata } from "next";
import Link from "next/link";
import {
  getDiscontinuedWorksWithRetrospective,
  getExperiencePostsByType,
  getMostHelpfulPosts,
} from "@/app/lib/queries";
import { SITE_URL } from "@/app/lib/email";
import { SiteHeader } from "@/app/components/SiteHeader";
import { DiscontinuedWorkCard } from "@/app/components/DiscontinuedWorkCard";
import { ExperiencePostCard } from "@/app/components/ExperiencePostCard";
import { WorkMediaTabs } from "@/app/components/WorkMediaTabs";
import type { Work } from "@/app/lib/mock-data";
import type { ExperiencePostView } from "@/app/lib/queries";

// /rankingや/tag/[tag]と同じく、DB接続が要るためビルド時プリレンダー
// 対象から明示的に外す(Dockerfileのビルド時DATABASE_URLはダミーの
// 接続不能な値のため)。
export const dynamic = "force-dynamic";

const title = "みんなの経験値";
const description = "他人の成功も失敗も、自分の経験値に。Draftlyに集まった学び・気づきをまとめて見る";

export const metadata: Metadata = {
  title: `${title} | Draftly`,
  description,
  alternates: { canonical: `${SITE_URL}/experience` },
  openGraph: { title, description, type: "website", siteName: "Draftly" },
  twitter: { card: "summary_large_image", title, description },
};

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-raised)] p-8 text-center">
      <p className="text-sm font-medium text-[var(--ink-soft)]">{message}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-[var(--ink-faint)]">
        制作タイムラインに経験タイプを添えて投稿すると、ここに集まっていきます。
      </p>
      <Link
        href="/home?composer=1#composer"
        className="mt-4 inline-flex rounded-full border border-[var(--line)] px-3 py-1.5 text-[12px] text-[var(--ink-soft)] hover:border-[var(--accent)]"
      >
        投稿してみる
      </Link>
    </div>
  );
}

function PostList({
  posts,
  helpfulCounts,
  emptyMessage,
}: {
  posts: ExperiencePostView[];
  helpfulCounts?: Map<string, number>;
  emptyMessage: string;
}) {
  if (posts.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <div className="flex flex-col gap-2.5">
      {posts.map((post) => (
        <ExperiencePostCard key={post.id} post={post} helpfulCount={helpfulCounts?.get(post.id)} />
      ))}
    </div>
  );
}

function DiscontinuedList({ works, emptyMessage }: { works: Work[]; emptyMessage: string }) {
  if (works.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <div className="flex flex-col gap-2.5">
      {works.map((work) => (
        <DiscontinuedWorkCard key={work.id} work={work} />
      ))}
    </div>
  );
}

export default async function ExperiencePage() {
  const [helpfulPosts, failurePosts, successPosts, discontinuedWorks] = await Promise.all([
    getMostHelpfulPosts(20),
    getExperiencePostsByType("failure", 20),
    getExperiencePostsByType("success", 20),
    getDiscontinuedWorksWithRetrospective(20),
  ]);
  const helpfulCounts = new Map(helpfulPosts.map((p) => [p.id, p.helpfulCount]));

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
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">Experience</p>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)] sm:text-2xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
            うまくいったことも、うまくいかなかったことも。誰かの試行錯誤が、次に何かを作る誰かのヒントになります。
          </p>
        </div>

        <WorkMediaTabs
          tabs={[
            {
              id: "helpful",
              label: "参考になった投稿",
              content: (
                <div className="pt-2">
                  <p className="mb-4 text-[12px] leading-relaxed text-[var(--ink-faint)]">
                    「📖 参考になった」が多く押されている制作タイムラインの投稿です。
                  </p>
                  <PostList
                    posts={helpfulPosts}
                    helpfulCounts={helpfulCounts}
                    emptyMessage="まだ「参考になった」が押された投稿がありません"
                  />
                </div>
              ),
            },
            {
              id: "failure",
              label: "失敗から学んだこと",
              content: (
                <div className="pt-2">
                  <p className="mb-4 text-[12px] leading-relaxed text-[var(--ink-faint)]">
                    「失敗から分かったこと」タグの付いた投稿です。うまくいかなかった経験こそ、誰かの近道になります。
                  </p>
                  <PostList posts={failurePosts} emptyMessage="まだ「失敗から分かったこと」の投稿がありません" />
                </div>
              ),
            },
            {
              id: "success",
              label: "うまくいったこと",
              content: (
                <div className="pt-2">
                  <p className="mb-4 text-[12px] leading-relaxed text-[var(--ink-faint)]">
                    「うまくいった」タグの付いた投稿です。実際に効果があった工夫を見られます。
                  </p>
                  <PostList posts={successPosts} emptyMessage="まだ「うまくいった」の投稿がありません" />
                </div>
              ),
            },
            {
              id: "discontinued",
              label: "開発中止から得た学び",
              content: (
                <div className="pt-2">
                  <p className="mb-4 text-[12px] leading-relaxed text-[var(--ink-faint)]">
                    開発を中止した作品に書かれた振り返りです。完成しなかったことより、そこで得た気づきに価値があります。
                  </p>
                  <DiscontinuedList
                    works={discontinuedWorks}
                    emptyMessage="まだ振り返りが書かれた「開発中止」の作品がありません"
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
