import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyReactions, getPosts, getWorksByPlatform } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SITE_URL } from "@/app/lib/email";
import { PLATFORM_META, PLATFORM_ORDER } from "@/app/lib/platform-meta";
import { SiteHeader } from "@/app/components/SiteHeader";
import { WorkCard } from "@/app/components/WorkCard";

// categoryが実質機能していない(post-actions.tsのcreatePost参照)ため、
// カテゴリページの代わりに対応環境(platform)軸で一覧化する。
// /tag/[tag]と同じくビルド時プリレンダー対象から明示的に外す
// (Dockerfileのビルド時DATABASE_URLはダミーの接続不能な値のため)。
export const dynamic = "force-dynamic";

function isKnownPlatform(value: string): value is (typeof PLATFORM_ORDER)[number] {
  return (PLATFORM_ORDER as string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ platform: string }>;
}): Promise<Metadata> {
  const { platform: raw } = await params;
  const platform = decodeURIComponent(raw);
  if (!isKnownPlatform(platform)) return { title: "見つかりません | Draftly" };
  const label = PLATFORM_META[platform].label;
  const title = `${label}対応の作品`;
  const description = `Draftlyで${label}に対応した作品をまとめて見る`;

  return {
    title: `${title} | Draftly`,
    description,
    alternates: { canonical: `${SITE_URL}/platform/${encodeURIComponent(platform)}` },
    openGraph: { title, description, type: "website", siteName: "Draftly" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PlatformPage({ params }: { params: Promise<{ platform: string }> }) {
  const { platform: raw } = await params;
  const platform = decodeURIComponent(raw);
  if (!isKnownPlatform(platform)) notFound();
  const { label, Icon } = PLATFORM_META[platform];

  const [works, posts, myReactions, currentUser] = await Promise.all([
    getWorksByPlatform(platform),
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

        <h1 className="mb-1 flex items-center gap-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
          <Icon className="h-5 w-5" />
          {label}対応の作品
        </h1>
        <p className="mb-6 text-[13px] text-[var(--ink-faint)]">{works.length}件見つかりました</p>

        {works.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-faint)]">
            まだ{label}対応の作品はありません
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {works.map((w) => (
              <WorkCard
                key={w.id}
                work={w}
                posts={posts}
                myReactions={myReactions}
                currentUserId={currentUser?.id ?? null}
                variant="horizontal"
                showAnchor={false}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
