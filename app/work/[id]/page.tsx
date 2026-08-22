import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getCommentsForProject,
  getInspiredByProject,
  getMyCommentCount,
  getMyPostCount,
  getMyReactions,
  getMyReactionsForProject,
  getPosts,
  getRelatedWorks,
  getWorkById,
  incrementViews,
  isBlockedByAuthor,
} from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SITE_URL } from "@/app/lib/email";
import { postsForProject } from "@/app/lib/post-helpers";
import { WorkDetail } from "@/app/components/WorkDetail";
import type { Work } from "@/app/lib/mock-data";

// ビルド時点でDBに到達できない環境(CIなど)でも `next build` を通すため、
// あえて何も返さない。
export async function generateStaticParams() {
  return [];
}

// このページはcookies()(自分のリアクション状態・ブロック判定)を読み、
// 閲覧のたびにincrementViews()で件数を更新するため、本質的に毎回動的。
// generateStaticParamsと共存させたままcookies()を呼ぶと本番ビルドで
// DYNAMIC_SERVER_USAGEエラーになるため、明示的に動的レンダリングにする
// (静的キャッシュは元々このページの実態に合っていなかった)。
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const work = await getWorkById(id);
  if (!work) {
    return { title: "作品が見つかりません | Draftly" };
  }

  const catchPreview = work.catch.length > 96 ? `${work.catch.slice(0, 96)}…` : work.catch;
  const description = `${catchPreview} — Draftlyで制作過程を見る`;

  return {
    title: `${work.title} | Draftly`,
    description,
    // XでのシェアURLに?v=Nのようなキャッシュバスティング用クエリを付けて
    // きたため、クエリ違いを別ページ(重複コンテンツ)とGoogleに誤認され
    // ないよう、クエリ無しの正規URLを明示する。
    alternates: { canonical: `${SITE_URL}/work/${work.id}` },
    openGraph: {
      title: `${work.title} | Draftly`,
      description,
      type: "article",
      siteName: "Draftly",
    },
    twitter: {
      card: "summary_large_image",
      title: `${work.title} | Draftly`,
      description,
    },
  };
}

// 検索エンジン向けの構造化データ(schema.org/CreativeWork)。ユーザー投稿の
// アイデア・プロトタイプ・公開済みサービスまで幅広く扱うため、
// SoftwareApplication等の狭い型ではなく汎用的なCreativeWorkを使う。
function workJsonLd(work: Work) {
  const url = `${SITE_URL}/work/${work.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: work.title,
    description: work.catch,
    url,
    ...(work.coverImageUrl ? { image: work.coverImageUrl } : {}),
    ...(work.createdAtIso ? { datePublished: work.createdAtIso } : {}),
    author: {
      "@type": "Person",
      name: work.author,
      url: `${SITE_URL}/u/${encodeURIComponent(work.authorHandle ?? work.author)}`,
    },
  };
}

export default async function WorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const work = await getWorkById(id);
  if (!work) notFound();

  const [
    posts,
    myReactions,
    comments,
    currentUser,
    session,
    inspiredItems,
    inspiredMyReactions,
    blockedByAuthor,
    guestCommentCount,
    guestPostCount,
    relatedWorks,
  ] = await Promise.all([
    getPosts(),
    getMyReactionsForProject(work.id),
    getCommentsForProject(work.id),
    getCurrentUser(),
    auth(),
    getInspiredByProject(work.id),
    getMyReactions(),
    isBlockedByAuthor(work.authorId ?? ""),
    getMyCommentCount(),
    getMyPostCount(),
    getRelatedWorks(work),
    incrementViews(work.id),
  ]);
  const timeline = postsForProject(work.id, posts);

  // 今の訪問分をその場で足す(再取得はしない)。実際のDB値は次の読み込みから反映される。
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(workJsonLd(work)) }}
      />
      <WorkDetail
        work={{ ...work, views: work.views + 1 }}
        timeline={timeline}
        myReactions={myReactions}
        comments={comments}
        currentUserId={currentUser?.id ?? null}
        isLoggedIn={!!session?.user}
        guestCommentCount={guestCommentCount}
        guestPostCount={guestPostCount}
        inspiredItems={inspiredItems}
        posts={posts}
        inspiredMyReactions={inspiredMyReactions}
        blockedByAuthor={blockedByAuthor}
        initialTab={tab}
        relatedWorks={relatedWorks}
      />
    </>
  );
}
