"use client";

import Link from "next/link";
import { POST_TYPE_META, type Post, type Work } from "@/app/lib/mock-data";
import type { ActivityView } from "@/app/lib/queries";
import { useFollowedAuthors } from "@/app/lib/follow-store";
import { formatRelativeHours } from "@/app/lib/format";
import { latestPostFor } from "@/app/lib/post-helpers";
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
        {formatRelativeHours(post.hoursAgo)}・{POST_TYPE_META[post.type].label}
      </p>
      <p className="text-[13.5px] text-[var(--ink)]">
        <span className="text-[var(--teal)]">{work.title}</span>
      </p>
      <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{post.body}</p>
    </a>
  );
}

function MyProjectRow({ work, posts }: { work: Work; posts: Post[] }) {
  const latest = latestPostFor(work.id, posts);
  return (
    <Link
      href={`/work/${work.id}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--bg-sunken)]"
    >
      <div className="w-10 shrink-0">
        <WorkThumb hue={work.hue} glyph={work.glyph} compact />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-[var(--ink)]">{work.title}</p>
        <p className="truncate text-[12px] text-[var(--ink-faint)]">
          {work.stage}
          {latest ? ` ・ ${formatRelativeHours(latest.hoursAgo)}更新` : ""}
        </p>
      </div>
    </Link>
  );
}

function ActivityRow({ item }: { item: ActivityView }) {
  const meta = POST_TYPE_META[item.type];
  const body = (
    <>
      <p className="text-[12px] text-[var(--ink-faint)]">
        <span className="font-medium text-[var(--ink-soft)]">{item.authorName}</span> ・{" "}
        {meta.icon} {formatRelativeHours(item.hoursAgo)}
        {item.projectTitle ? ` ・ ${item.projectTitle}` : ""}
      </p>
      <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
    </>
  );
  // プロジェクトに紐付いた投稿だけ詳細ページへのリンクにする(RecentActivity.tsxと同じ理由)。
  return item.projectId ? (
    <Link href={`/work/${item.projectId}`} className="block rounded-lg px-2 py-2 hover:bg-[var(--bg-sunken)]">
      {body}
    </Link>
  ) : (
    <div className="rounded-lg px-2 py-2">{body}</div>
  );
}

export function Sidebar({
  ranking,
  posts,
  works,
  activity,
  myProjects,
}: {
  ranking: Work[];
  posts: Post[];
  works: Work[];
  activity: ActivityView[];
  myProjects: Work[];
}) {
  const followedAuthors = useFollowedAuthors();
  const followedPosts = posts
    .map((post) => ({ post, work: works.find((w) => w.id === post.projectId) }))
    .filter((entry): entry is { post: Post; work: Work } => !!entry.work && followedAuthors.has(entry.work.author))
    .sort((a, b) => a.post.hoursAgo - b.post.hoursAgo)
    .slice(0, 6);

  return (
    <aside className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <h3 className="mb-2 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
          自分の創作物
        </h3>
        {myProjects.length === 0 ? (
          <div className="px-2 py-3 text-[12.5px] text-[var(--ink-faint)]">
            <p className="mb-1.5">まだ作品がありません。</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/#composer" className="text-[var(--accent)] underline decoration-dotted">
                投稿してみる
              </Link>
              <Link href="/guide" className="text-[var(--accent)] underline decoration-dotted">
                使い方を見る
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {myProjects.map((w) => (
              <MyProjectRow key={w.id} work={w} posts={posts} />
            ))}
          </div>
        )}
      </div>

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

      {activity.length > 0 && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <h3 className="mb-2 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
            最新の創作活動
          </h3>
          <div className="flex flex-col divide-y divide-[var(--line)]">
            {activity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

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
