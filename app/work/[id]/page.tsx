import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllProjectIds,
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

export async function generateStaticParams() {
  const ids = await getAllProjectIds();
  return ids.map((id) => ({ id }));
}

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

  const [posts, myReactions, comments, currentUser, inspiredItems, inspiredMyReactions, blockedByAuthor] =
    await Promise.all([
      getPosts(),
      getMyReactionsForProject(work.id),
      getCommentsForProject(work.id),
      getCurrentUser(),
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
      inspiredItems={inspiredItems}
      posts={posts}
      inspiredMyReactions={inspiredMyReactions}
      blockedByAuthor={blockedByAuthor}
    />
  );
}
