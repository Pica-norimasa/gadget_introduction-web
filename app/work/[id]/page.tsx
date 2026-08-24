import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getCommentsForProject,
  getHelpfulCounts,
  getInspiredByProject,
  getMyCommentCount,
  getMyHelpfulPostIds,
  getMyPostCount,
  getMyReactions,
  getMyReactionsForProject,
  getPosts,
  getProjectExperienceStats,
  getRelatedWorks,
  getWorkById,
  incrementViews,
  isBlockedByAuthor,
} from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SITE_URL } from "@/app/lib/email";
import { postsForProject } from "@/app/lib/post-helpers";
import { ScrollToTopOnMount } from "@/app/components/ScrollToTopOnMount";
import { WorkDetail } from "@/app/components/WorkDetail";

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

  // 「参考になった」件数・自分が押済みか・学び集計(学び/失敗/成功)は、
  // timeline(=postsから絞り込んだこのProjectの投稿)が確定してから
  // でないと対象の投稿IDが分からないため、上のPromise.allとは別に取得する。
  const timelinePostIds = timeline.map((p) => p.id);
  const [helpfulCountsMap, myHelpfulPostIdSet, experienceStats] = await Promise.all([
    getHelpfulCounts(timelinePostIds),
    getMyHelpfulPostIds(timelinePostIds),
    getProjectExperienceStats(work.id),
  ]);
  const helpfulCounts = Object.fromEntries(helpfulCountsMap);
  const myHelpfulPostIds = [...myHelpfulPostIdSet];

  // 今の訪問分をその場で足す(再取得はしない)。実際のDB値は次の読み込みから反映される。
  return (
    <>
      <ScrollToTopOnMount />
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
        helpfulCounts={helpfulCounts}
        myHelpfulPostIds={myHelpfulPostIds}
        experienceStats={experienceStats}
      />
    </>
  );
}
