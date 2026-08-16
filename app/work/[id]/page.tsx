import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyReactionsForProject, getPosts, getWorkById, getWorks, incrementViews } from "@/app/lib/queries";
import { postsForProject } from "@/app/lib/post-helpers";
import { WorkDetail } from "@/app/components/WorkDetail";

export async function generateStaticParams() {
  const works = await getWorks();
  return works.map((w) => ({ id: w.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const work = await getWorkById(id);
  if (!work) {
    return { title: "作品が見つかりません | きざし" };
  }

  const description = work.catch.length > 120 ? `${work.catch.slice(0, 120)}…` : work.catch;

  return {
    title: `${work.title} | きざし`,
    description,
    openGraph: {
      title: work.title,
      description,
      type: "article",
      siteName: "きざし",
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

  const [posts, myReactions] = await Promise.all([
    getPosts(),
    getMyReactionsForProject(work.id),
    incrementViews(work.id),
  ]);
  const timeline = postsForProject(work.id, posts);

  // 今の訪問分をその場で足す(再取得はしない)。実際のDB値は次の読み込みから反映される。
  return <WorkDetail work={{ ...work, views: work.views + 1 }} timeline={timeline} myReactions={myReactions} />;
}
