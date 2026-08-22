import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBlockedUsers,
  getFollowingList,
  getMutedUsers,
  getMyBookmarkedWorks,
  getMyReactions,
  getPosts,
  getStandalonePostsByAuthor,
  getUserProfile,
  type UserProfile,
} from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { SITE_URL } from "@/app/lib/email";
import { TOOL_META } from "@/app/lib/tool-meta";
import { AuthorAvatar } from "@/app/components/AuthorAvatar";
import { AuthorStats } from "@/app/components/AuthorStats";
import { AvatarEditor } from "@/app/components/AvatarEditor";
import { BioEditor } from "@/app/components/BioEditor";
import { DisplayNameEditor } from "@/app/components/DisplayNameEditor";
import { FollowingList } from "@/app/components/FollowingList";
import { GitHubMark, XMark } from "@/app/components/BrandIcons";
import { FollowButton } from "@/app/components/FollowButton";
import { MoreActionsMenu } from "@/app/components/MoreActionsMenu";
import { MutedBlockedList } from "@/app/components/MutedBlockedList";
import { ProfileTabs } from "@/app/components/ProfileTabs";
import { ShareButtons } from "@/app/components/ShareButtons";
import { SiteHeader } from "@/app/components/SiteHeader";
import { StandalonePostCard } from "@/app/components/StandalonePostCard";
import { WorkCard } from "@/app/components/WorkCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const profile = await getUserProfile(decodeURIComponent(name));
  if (!profile) return { title: "ユーザーが見つかりません | Draftly" };

  const title = profile.displayName;
  const description = profile.bio || `${profile.displayName}さんがDraftlyに投稿した作品一覧`;

  return {
    title: `${title} | Draftly`,
    description,
    alternates: { canonical: `${SITE_URL}/u/${encodeURIComponent(profile.name)}` },
    openGraph: { title, description, type: "profile", siteName: "Draftly" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// プロフィールを検索エンジン・SNS双方から辿れるようにする構造化データ
// (schema.org/Person)。/work・/postと同じくSITE_URLで絶対URLを組み立てる。
function profileJsonLd(profile: UserProfile) {
  const sameAs = [
    profile.githubUsername ? `https://github.com/${profile.githubUsername}` : null,
    profile.xUsername ? `https://x.com/${profile.xUsername}` : null,
  ].filter((url): url is string => !!url);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    url: `${SITE_URL}/u/${encodeURIComponent(profile.name)}`,
    ...(profile.image ? { image: profile.image } : {}),
    ...(profile.bio ? { description: profile.bio } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

// 訪問者に「何で作っている人か」を一目で伝える公開向けの集計
// (AuthorStats.tsxは「自分にだけ表示」の非公開分析なので別物)。
// 新規クエリ不要、既に取得済みのworksをその場で集計するだけ。
function topTools(works: UserProfile["works"], limit = 3): { tool: keyof typeof TOOL_META; count: number }[] {
  const counts = new Map<keyof typeof TOOL_META, number>();
  for (const w of works) {
    if (!w.tool) continue;
    counts.set(w.tool, (counts.get(w.tool) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tool, count]) => ({ tool, count }));
}

export default async function UserProfilePage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const [profile, posts, myReactions, currentUser] = await Promise.all([
    getUserProfile(decodedName),
    getPosts(),
    getMyReactions(),
    getCurrentUser(),
  ]);
  if (!profile) notFound();
  const isOwnProfile = profile.id === currentUser?.id;
  const [murmurs, followingList] = await Promise.all([
    getStandalonePostsByAuthor(profile.id),
    getFollowingList(profile.id),
  ]);

  // ミュート/ブロック中一覧・ブックマークは「自分の」状態を返すクエリなので、
  // 他人のプロフィールを見ているときに取得しても意味が無い(表示もしない)。
  const [mutedUsers, blockedUsers, bookmarkedWorks] = isOwnProfile
    ? await Promise.all([getMutedUsers(), getBlockedUsers(), getMyBookmarkedWorks()])
    : [[], [], []];
  const featuredTools = topTools(profile.works);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd(profile)) }}
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ← ホームに戻る
        </Link>

        <div className="mb-8 flex items-start gap-3">
          {isOwnProfile ? (
            <AvatarEditor name={profile.displayName} image={profile.image} size={56} />
          ) : (
            <AuthorAvatar name={profile.displayName} image={profile.image} size={56} />
          )}
          <div className="min-w-0 flex-1">
            {isOwnProfile ? (
              <DisplayNameEditor name={profile.displayName} />
            ) : (
              <h1 className="truncate font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                {profile.displayName}
              </h1>
            )}
            <p className="truncate text-[13px] text-[var(--ink-faint)]">@{profile.name}</p>
            {(profile.githubUsername || profile.xUsername) && (
              <p className="mt-0.5 flex items-center gap-2.5">
                {profile.githubUsername && (
                  <a
                    href={`https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`GitHub: @${profile.githubUsername}`}
                    className="inline-flex items-center gap-1 text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)] hover:underline"
                  >
                    <GitHubMark />@{profile.githubUsername}
                  </a>
                )}
                {profile.xUsername && (
                  <a
                    href={`https://x.com/${profile.xUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`X: @${profile.xUsername}`}
                    className="inline-flex items-center gap-1 text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)] hover:underline"
                  >
                    <XMark />@{profile.xUsername}
                  </a>
                )}
              </p>
            )}
            <p className="text-[13px] text-[var(--ink-faint)]">
              フォロワー{profile.followers} ・ フォロー中{profile.following}
            </p>
            {isOwnProfile ? (
              <BioEditor bio={profile.bio} />
            ) : (
              profile.bio && (
                <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                  {profile.bio}
                </p>
              )
            )}
          </div>
          {isOwnProfile ? (
            <Link
              href="/settings"
              title="設定"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-soft)]"
            >
              ⚙️
            </Link>
          ) : (
            <div className="flex items-center gap-1">
              <FollowButton author={profile.name} size="md" />
              <MoreActionsMenu
                reportTarget={{ type: "user", id: profile.id }}
                author={{ id: profile.id, name: profile.name }}
              />
            </div>
          )}
        </div>

        <div className="mb-8 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-[13px] font-semibold text-[var(--ink)]">活動サマリー</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)]/45 px-3 py-2">
                <p className="font-mono text-lg font-semibold text-[var(--ink)]">{profile.works.length}</p>
                <p className="text-[11px] text-[var(--ink-faint)]">投稿作品</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)]/45 px-3 py-2">
                <p className="font-mono text-lg font-semibold text-[var(--ink)]">{murmurs.length}</p>
                <p className="text-[11px] text-[var(--ink-faint)]">つぶやき</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)]/45 px-3 py-2">
                <p className="font-mono text-lg font-semibold text-[var(--ink)]">{profile.repostedWorks.length}</p>
                <p className="text-[11px] text-[var(--ink-faint)]">リポスト</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[12px] font-medium text-[var(--ink-faint)]">よく使うツール</p>
              {featuredTools.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {featuredTools.map(({ tool, count }) => (
                    <Link
                      key={tool}
                      href={`/tool/${tool}`}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg-sunken)] px-2.5 py-1 text-[11px] font-mono text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {TOOL_META[tool].label}
                      <span className="text-[var(--ink-faint)]">×{count}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--ink-faint)]">まだ作品の使用ツールは登録されていません</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)]/45 p-3">
            <p className="mb-1 text-[12px] font-medium text-[var(--ink-soft)]">このプロフィールを共有</p>
            <p className="mb-3 text-[11px] leading-relaxed text-[var(--ink-faint)]">
              気になる制作者を、SNSやチャットで紹介できます。
            </p>
            <ShareButtons title={`${profile.displayName}のDraftlyプロフィール`} />
          </div>
        </div>

        {isOwnProfile && <AuthorStats works={profile.works} />}

        <ProfileTabs
          postedLabel={`投稿した作品(${profile.works.length})`}
          repostedLabel={`リポストした作品(${profile.repostedWorks.length})`}
          murmursLabel={`つぶやき(${murmurs.length})`}
          followingLabel={`フォロー中(${followingList.length})`}
          bookmarkedLabel={`ブックマーク(${bookmarkedWorks.length})`}
          showBlockedTab={isOwnProfile}
          showBookmarksTab={isOwnProfile}
          postedContent={
            profile.works.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-faint)]">まだ投稿された作品はありません</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profile.works.map((work) => (
                  <WorkCard
                    key={work.id}
                    work={work}
                    posts={posts}
                    myReactions={myReactions}
                    currentUserId={currentUser?.id ?? null}
                    showAnchor={false}
                  />
                ))}
              </div>
            )
          }
          repostedContent={
            profile.repostedWorks.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-faint)]">まだリポストした作品はありません</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profile.repostedWorks.map((work) => (
                  <WorkCard
                    key={work.id}
                    work={work}
                    posts={posts}
                    myReactions={myReactions}
                    currentUserId={currentUser?.id ?? null}
                    showAnchor={false}
                  />
                ))}
              </div>
            )
          }
          blockedContent={<MutedBlockedList mutedUsers={mutedUsers} blockedUsers={blockedUsers} />}
          followingContent={<FollowingList users={followingList} />}
          bookmarkedContent={
            bookmarkedWorks.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-faint)]">まだブックマークした作品はありません</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookmarkedWorks.map((work) => (
                  <WorkCard
                    key={work.id}
                    work={work}
                    posts={posts}
                    myReactions={myReactions}
                    currentUserId={currentUser?.id ?? null}
                    showAnchor={false}
                  />
                ))}
              </div>
            )
          }
          murmursContent={
            murmurs.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-faint)]">まだつぶやきはありません</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {murmurs.map((post) => (
                  <StandalonePostCard key={post.id} post={post} />
                ))}
              </div>
            )
          }
        />
      </main>
    </div>
  );
}
