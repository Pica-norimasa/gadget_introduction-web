import { POST_TYPE_META, type PostType } from "@/app/lib/mock-data";
import { prisma } from "@/app/lib/prisma";

function formatRelative(date: Date): string {
  const hours = Math.max(0, Math.round((Date.now() - date.getTime()) / 3_600_000));
  if (hours < 1) return "たった今";
  if (hours < 24) return `${hours}時間前`;
  return `${Math.round(hours / 24)}日前`;
}

// 投稿コンポーザーで実際に作られたPostがDBに残っていることをその場で
// 確認できるよう、DBから直接クエリして出す(mock-data.tsとは別の実体)。
export async function RecentActivity() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { author: true, project: true },
  });

  if (posts.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-2 pt-4 sm:px-6">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
        最新の創作活動
      </p>
      <div className="flex flex-col gap-2">
        {posts.map((post) => {
          const meta = POST_TYPE_META[post.type as PostType];
          return (
            <div key={post.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2">
              <p className="mb-0.5 font-mono text-[11px] text-[var(--ink-faint)]">
                <span className="font-medium text-[var(--ink-soft)]">{post.author.name}</span> ・{" "}
                {meta.icon} {meta.label} ・ {formatRelative(post.createdAt)}
                {post.project ? ` ・ ${post.project.title}` : ""}
              </p>
              <p className="text-[13.5px] leading-relaxed text-[var(--ink)]">{post.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
