import Link from "next/link";
import type { StandalonePostView } from "@/app/lib/queries";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";

// プロジェクトに紐付けない気軽な投稿専用の、横スクロールの帯。
// プロダクト一覧(HeroRail/FeedSection)を主役の座から動かしたくない
// ので、その下に控えめなサイズで挟み込む形にしている(StoriesStripと
// 同じ「ヒーローの下に細い帯」という配置パターン)。クリック先は
// /post/[id](投稿単体の詳細ページ、コメントも付けられる)。
export function MurmurStrip({ posts }: { posts: StandalonePostView[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">つぶやき</p>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="flex w-56 shrink-0 flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 hover:border-[var(--accent)]"
          >
            <div className="flex items-center gap-2">
              <AuthorAvatar name={post.authorName} size={24} />
              <span className="truncate text-[12px] font-medium text-[var(--ink-soft)]">{post.authorName}</span>
              <span className="ml-auto shrink-0 text-[11px] text-[var(--ink-faint)]">
                {formatRelativeHours(post.hoursAgo)}
              </span>
            </div>
            {post.body && <p className="line-clamp-3 text-[13px] leading-relaxed text-[var(--ink)]">{post.body}</p>}
            {post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- ローカルアップロードのパスなのでnext/imageの最適化対象外
              <img src={post.imageUrl} alt="" className="h-20 w-full rounded-lg object-cover" />
            )}
            <span className="mt-auto font-mono text-[11px] text-[var(--ink-faint)]">💬{post.commentsCount}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
