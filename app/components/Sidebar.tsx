"use client";

import { POST_TYPE_META, type Post, type Work } from "@/app/lib/mock-data";
import { useFollowedAuthors } from "@/app/lib/follow-store";
import { WorkThumb } from "./WorkThumb";

function RankingRow({ rank, work }: { rank: number; work: Work }) {
  return (
    <a
      href={`#work-${work.id}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--bg-sunken)]"
    >
      <span className="w-5 shrink-0 font-mono text-sm font-bold text-[var(--ink-faint)]">{rank}</span>
      <div className="w-10 shrink-0">
        <WorkThumb hue={work.hue} glyph={work.glyph} compact />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-[var(--ink)]">{work.title}</p>
        <p className="truncate text-[12px] text-[var(--ink-faint)]">{work.author}</p>
      </div>
    </a>
  );
}

function PostRow({ post, work }: { post: Post; work: Work }) {
  return (
    <a href={`#work-${post.projectId}`} className="block rounded-lg px-2 py-2 hover:bg-[var(--bg-sunken)]">
      <p className="text-[12px] text-[var(--ink-faint)]">
        <span className="font-medium text-[var(--ink-soft)]">{work.author}</span> ・{" "}
        {POST_TYPE_META[post.type].icon}
        {post.hoursAgo}時間前・{POST_TYPE_META[post.type].label}
      </p>
      <p className="text-[13.5px] text-[var(--ink)]">
        <span className="text-[var(--teal)]">{work.title}</span>
      </p>
      <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{post.body}</p>
    </a>
  );
}

export function Sidebar({
  ranking,
  posts,
  works,
}: {
  ranking: Work[];
  posts: Post[];
  works: Work[];
}) {
  const followedAuthors = useFollowedAuthors();
  const followedPosts = posts
    .map((post) => ({ post, work: works.find((w) => w.id === post.projectId) }))
    .filter((entry): entry is { post: Post; work: Work } => !!entry.work && followedAuthors.has(entry.work.author))
    .sort((a, b) => a.post.hoursAgo - b.post.hoursAgo)
    .slice(0, 6);

  return (
    <aside className="flex flex-col gap-6">
      <div id="ranking" className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 scroll-mt-24">
        <h3 className="mb-2 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
          週間ランキング
        </h3>
        <div className="flex flex-col gap-0.5">
          {ranking.map((w, i) => (
            <RankingRow key={w.id} rank={i + 1} work={w} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <h3 className="mb-2 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
          フォロー中の創作活動
        </h3>
        {followedPosts.length === 0 ? (
          <p className="px-2 py-3 text-[12.5px] text-[var(--ink-faint)]">
            気になる作者をフォローすると、ここに投稿が届きます
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--line)]">
            {followedPosts.map(({ post, work }) => (
              <PostRow key={post.id} post={post} work={work} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
