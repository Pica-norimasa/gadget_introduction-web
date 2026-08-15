import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { works } from "@/app/lib/mock-data";
import { WorkDetail } from "@/app/components/WorkDetail";

export function generateStaticParams() {
  return works.map((w) => ({ id: w.id }));
}

function findWork(id: string) {
  return works.find((w) => w.id === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const work = findWork(id);
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
  const work = findWork(id);
  if (!work) notFound();

  return <WorkDetail work={work} />;
}
