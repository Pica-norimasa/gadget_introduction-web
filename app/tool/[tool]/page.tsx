import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyReactions, getPosts, getWorksByTool } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { TOOL_META, TOOL_ORDER } from "@/app/lib/tool-meta";
import { SiteHeader } from "@/app/components/SiteHeader";
import { WorkCard } from "@/app/components/WorkCard";

// categoryが実質機能していない(post-actions.tsのcreatePost参照)ため、
// カテゴリページの代わりにtool軸で一覧化する。/tag/[tag]と同じく
// ビルド時プリレンダー対象から明示的に外す(Dockerfileのビルド時
// DATABASE_URLはダミーの接続不能な値のため)。
export const dynamic = "force-dynamic";

function isKnownTool(value: string): value is (typeof TOOL_ORDER)[number] {
  return (TOOL_ORDER as string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  if (!isKnownTool(tool)) return { title: "見つかりません | Draftly" };
  const label = TOOL_META[tool].label;
  const title = `${label}で作られた作品`;
  const description = `Draftlyで${label}を使って作られた作品をまとめて見る`;

  return {
    title: `${title} | Draftly`,
    description,
    openGraph: { title, description, type: "website", siteName: "Draftly" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  if (!isKnownTool(tool)) notFound();
  const label = TOOL_META[tool].label;

  const [works, posts, myReactions, currentUser] = await Promise.all([
    getWorksByTool(tool),
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

        <h1 className="mb-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
          {label}で作られた作品
        </h1>
        <p className="mb-6 text-[13px] text-[var(--ink-faint)]">{works.length}件見つかりました</p>

        {works.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-faint)]">
            まだ{label}で作られた作品はありません
          </p>
        ) : (
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
        )}
      </main>
    </div>
  );
}
