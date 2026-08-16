import { notFound, redirect } from "next/navigation";
import { getWorkById } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { ProjectEditForm } from "@/app/components/ProjectEditForm";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [work, user] = await Promise.all([getWorkById(id), getCurrentUser()]);
  if (!work) notFound();
  // 自分のProjectでなければ編集ページには入れず、詳細ページへ戻す。
  if (!user || work.authorId !== user.id) redirect(`/work/${id}`);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
          作品を編集
        </h1>
        <ProjectEditForm work={work} />
      </main>
    </div>
  );
}
