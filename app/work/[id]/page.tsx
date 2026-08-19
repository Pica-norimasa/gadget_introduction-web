import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getCommentsForProject,
  getInspiredByProject,
  getMyReactions,
  getMyReactionsForProject,
  getPosts,
  getWorkById,
  incrementViews,
  isBlockedByAuthor,
} from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { postsForProject } from "@/app/lib/post-helpers";
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

  const description = work.catch.length > 120 ? `${work.catch.slice(0, 120)}…` : work.catch;

  return {
    title: `${work.title} | Draftly`,
    description,
    openGraph: {
      title: work.title,
      description,
      type: "article",
      siteName: "Draftly",
    },
    twitter: {
      card: "summary_large_image",
      title: work.title,
      description,
    },
  };
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWorkById(id);
  if (!work) notFound();

  const [posts, myReactions, comments, currentUser, session, inspiredItems, inspiredMyReactions, blockedByAuthor] =
    await Promise.all([
      getPosts(),
      getMyReactionsForProject(work.id),
      getCommentsForProject(work.id),
      getCurrentUser(),
      auth(),
      getInspiredByProject(work.id),
      getMyReactions(),
      isBlockedByAuthor(work.authorId ?? ""),
      incrementViews(work.id),
    ]);
  const timeline = postsForProject(work.id, posts);

  // 今の訪問分をその場で足す(再取得はしない)。実際のDB値は次の読み込みから反映される。
  return (
    <WorkDetail
      work={{ ...work, views: work.views + 1 }}
      timeline={timeline}
      myReactions={myReactions}
      comments={comments}
      currentUserId={currentUser?.id ?? null}
      isLoggedIn={!!session?.user}
      inspiredItems={inspiredItems}
      posts={posts}
      inspiredMyReactions={inspiredMyReactions}
      blockedByAuthor={blockedByAuthor}
    />
  );
}
