"use client";

import Link from "next/link";
import { POST_TYPE_META, type Post, type Work } from "@/app/lib/mock-data";
import type { ActivityView, RepostView, SuggestedAuthor } from "@/app/lib/queries";
import { openComposer } from "@/app/lib/composer-store";
import { useFollowedAuthors } from "@/app/lib/follow-store";
import { formatRelativeHours } from "@/app/lib/format";
import { latestPostFor } from "@/app/lib/post-helpers";
import { AuthorAvatar } from "./AuthorAvatar";
import { CoverImage } from "./CoverImage";
import { FollowButton } from "./FollowButton";
import { WorkThumb } from "./WorkThumb";

// 行全体をワークへのリンクにしていたところに作者名リンクを混ぜると
// <a>のネスト(不正なHTML)になるため、「作品へのリンク」と「作者への
// リンク」を兄弟要素として分ける形に統一している(以下のPostRow/
// RepostRow/ActivityRowも同じ理由)。
function RankingRow({ rank, work }: { rank: number; work: Work }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--bg-sunken)]">
      <span className="w-5 shrink-0 font-mono text-sm font-bold text-[var(--ink-faint)]">{rank}</span>
      <a href={`#work-${work.id}`} className="w-10 shrink-0">
        {work.coverImageUrl ? (
          <CoverImage src={work.coverImageUrl} compact />
        ) : (
          <WorkThumb hue={work.hue} glyph={work.glyph} compact />
        )}
      </a>
      <div className="min-w-0 flex-1">
        <a href={`#work-${work.id}`} className="block truncate text-[13.5px] font-medium text-[var(--ink)] hover:underline">
          {work.title}
        </a>
        <Link
          href={`/u/${encodeURIComponent(work.authorHandle ?? work.author)}`}
          className="block truncate text-[12px] text-[var(--ink-faint)] hover:underline"
        >
          {work.author}
        </Link>
      </div>
    </div>
  );
}

function PostRow({ post, work }: { post: Post; work: Work }) {
  return (
    <div className="rounded-lg px-2 py-2 hover:bg-[var(--bg-sunken)]">
      <p className="text-[12px] text-[var(--ink-faint)]">
        <Link
          href={`/u/${encodeURIComponent(work.authorHandle ?? work.author)}`}
          className="font-medium text-[var(--ink-soft)] hover:underline"
        >
          {work.author}
        </Link>{" "}
        ・ {POST_TYPE_META[post.type].icon}
        {formatRelativeHours(post.hoursAgo)}・{POST_TYPE_META[post.type].label}
      </p>
      <a href={`#work-${post.projectId}`} className="block">
        <p className="text-[13.5px] text-[var(--ink)]">
          <span className="text-[var(--teal)]">{work.title}</span>
        </p>
        <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{post.body}</p>
      </a>
    </div>
  );
}

function RepostRow({ repost, work }: { repost: RepostView; work: Work }) {
  return (
    <div className="rounded-lg px-2 py-2 hover:bg-[var(--bg-sunken)]">
      <p className="text-[12px] text-[var(--ink-faint)]">
        🔁{" "}
        <Link
          href={`/u/${encodeURIComponent(repost.userName)}`}
          className="font-medium text-[var(--ink-soft)] hover:underline"
        >
          {repost.userName}
        </Link>
        さんが{repost.comment ? "引用リポスト" : "リポスト"} ・ {formatRelativeHours(repost.hoursAgo)}
      </p>
      <Link href={`/work/${work.id}`} className="block">
        {repost.comment && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-[var(--ink)]">{repost.comment}</p>
        )}
        <p className="text-[13.5px] text-[var(--ink)]">
          <span className="text-[var(--teal)]">{work.title}</span>
        </p>
        {!repost.comment && (
          <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{work.catch}</p>
        )}
      </Link>
    </div>
  );
}

function SuggestedAuthorRow({ author }: { author: SuggestedAuthor }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
      <Link href={`/u/${encodeURIComponent(author.name)}`} className="flex min-w-0 flex-1 items-center gap-2">
        <AuthorAvatar name={author.name} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-[var(--ink)]">{author.name}</p>
          <p className="truncate text-[12px] text-[var(--ink-faint)]">
            {author.bio || (author.topWork ? author.topWork.title : `フォロワー${author.followers}`)}
          </p>
        </div>
      </Link>
      <FollowButton author={author.name} />
    </div>
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
        {work.coverImageUrl ? (
          <CoverImage src={work.coverImageUrl} compact />
        ) : (
          <WorkThumb hue={work.hue} glyph={work.glyph} compact />
        )}
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
  const rest = (
    <>
      {meta.icon} {formatRelativeHours(item.hoursAgo)}
      {item.projectTitle ? ` ・ ${item.projectTitle}` : ""}
    </>
  );
  const body = (
    <p className="line-clamp-2 text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
  );
  return (
    <div className="rounded-lg px-2 py-2 hover:bg-[var(--bg-sunken)]">
      <p className="text-[12px] text-[var(--ink-faint)]">
        <Link
          href={`/u/${encodeURIComponent(item.authorName)}`}
          className="font-medium text-[var(--ink-soft)] hover:underline"
        >
          {item.authorName}
        </Link>{" "}
        ・{" "}
        {/* プロジェクトに紐付いた投稿だけ詳細ページへのリンクにする(RecentActivity.tsxと同じ理由)。 */}
        {item.projectId ? (
          <Link href={`/work/${item.projectId}`} className="hover:underline">
            {rest}
          </Link>
        ) : (
          rest
        )}
      </p>
      {item.projectId ? (
        <Link href={`/work/${item.projectId}`} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

type FollowedFeedEntry =
  | { kind: "post"; hoursAgo: number; post: Post; work: Work }
  | { kind: "repost"; hoursAgo: number; repost: RepostView; work: Work };

export function Sidebar({
  ranking,
  posts,
  works,
  activity,
  myProjects,
  currentUserName,
  reposts,
  suggestedAuthors,
  // ホームではSidebarをモバイルドロワー用とデスクトップ用の2箇所に描画
  // している(MobileSidebarDrawer.tsx参照)。id="ranking"を両方に付けると
  // 同じidがDOM内に2つできてしまい、ヘッダーの「ランキング」リンクが
  // 常に最初(=ドロワー側、fixedで画面外にいることが多い)にジャンプ
  // しようとして無反応になる。アンカーとして機能させたい側だけ
  // showRankingAnchor=trueを渡す(デフォルトtrue、ドロワー側だけfalse)。
  showRankingAnchor = true,
}: {
  ranking: Work[];
  posts: Post[];
  works: Work[];
  activity: ActivityView[];
  myProjects: Work[];
  currentUserName: string | null;
  reposts: RepostView[];
  suggestedAuthors: SuggestedAuthor[];
  showRankingAnchor?: boolean;
}) {
  const followedAuthors = useFollowedAuthors();

  // フォロー中の作者本人の投稿と、フォロー中の"誰か"がリポストした
  // (作者自体はフォロー対象でなくてもよい)作品を時系列でマージする。
  // これが「他人の投稿を自分のフォロワーに再配布する」実際の導線になる。
  const followedFeed: FollowedFeedEntry[] = [
    ...posts
      .map((post) => ({ post, work: works.find((w) => w.id === post.projectId) }))
      .filter((entry): entry is { post: Post; work: Work } => !!entry.work && followedAuthors.has(entry.work.author))
      .map((entry): FollowedFeedEntry => ({ kind: "post", hoursAgo: entry.post.hoursAgo, ...entry })),
    ...reposts
      .map((repost) => ({ repost, work: works.find((w) => w.id === repost.projectId) }))
      .filter(
        (entry): entry is { repost: RepostView; work: Work } =>
          !!entry.work && followedAuthors.has(entry.repost.userName),
      )
      .map((entry): FollowedFeedEntry => ({ kind: "repost", hoursAgo: entry.repost.hoursAgo, ...entry })),
  ]
    .sort((a, b) => a.hoursAgo - b.hoursAgo)
    .slice(0, 6);

  return (
    <aside className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
            自分の創作物
          </h3>
          {currentUserName && (
            <Link
              href={`/u/${encodeURIComponent(currentUserName)}`}
              className="shrink-0 text-[12px] text-[var(--accent)] hover:underline"
            >
              プロフィールを見る
            </Link>
          )}
        </div>
        {myProjects.length === 0 ? (
          <div className="px-2 py-3 text-[12.5px] text-[var(--ink-faint)]">
            <p className="mb-1.5">まだ作品がありません。</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => {
                  openComposer();
                  requestAnimationFrame(() => {
                    document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  });
                }}
                className="text-[var(--accent)] underline decoration-dotted"
              >
                投稿してみる
              </button>
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

      <Link
        href="/guide/build"
        className="block rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 hover:border-[var(--accent)]"
      >
        <h3 className="mb-1 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
          🔧 プロダクトの作り方
        </h3>
        <p className="text-[12.5px] leading-relaxed text-[var(--ink-faint)]">
          「自分にも作れるかも」と思ったら。GitHubのセットアップからAIツールでの作り方まで
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--accent)]">
          はじめての一本を作る →
        </span>
      </Link>

      <div
        id={showRankingAnchor ? "ranking" : undefined}
        className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 scroll-mt-24"
      >
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

      {suggestedAuthors.length > 0 && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
          <h3 className="mb-2 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
            おすすめの作者
          </h3>
          <div className="flex flex-col gap-0.5">
            {suggestedAuthors.map((author) => (
              <SuggestedAuthorRow key={author.id} author={author} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <h3 className="mb-2 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
          フォロー中の創作活動
        </h3>
        {followedFeed.length === 0 ? (
          <p className="px-2 py-3 text-[12.5px] text-[var(--ink-faint)]">
            気になる作者をフォローすると、ここに投稿やリポストが届きます
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--line)]">
            {followedFeed.map((entry) =>
              entry.kind === "post" ? (
                <PostRow key={`post-${entry.post.id}`} post={entry.post} work={entry.work} />
              ) : (
                <RepostRow key={`repost-${entry.repost.id}`} repost={entry.repost} work={entry.work} />
              ),
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
