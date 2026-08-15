import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPosts, getWorkById, getWorks } from "@/app/lib/queries";
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

  const posts = await getPosts();
  const timeline = postsForProject(work.id, posts);

  return <WorkDetail work={work} timeline={timeline} />;
}
