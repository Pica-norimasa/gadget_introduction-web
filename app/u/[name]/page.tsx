import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBlockedUsers,
  getMutedUsers,
  getMyReactions,
  getPosts,
  getStandalonePostsByAuthor,
  getUserProfile,
} from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { AuthorAvatar } from "@/app/components/AuthorAvatar";
import { AuthorStats } from "@/app/components/AuthorStats";
import { AvatarEditor } from "@/app/components/AvatarEditor";
import { BioEditor } from "@/app/components/BioEditor";
import { DisplayNameEditor } from "@/app/components/DisplayNameEditor";
import { GitHubMark, XMark } from "@/app/components/BrandIcons";
import { FollowButton } from "@/app/components/FollowButton";
import { MoreActionsMenu } from "@/app/components/MoreActionsMenu";
import { MutedBlockedList } from "@/app/components/MutedBlockedList";
import { ProfileTabs } from "@/app/components/ProfileTabs";
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
  return { title: `${profile.displayName} | Draftly` };
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
  const murmurs = await getStandalonePostsByAuthor(profile.id);

  // ミュート/ブロック中一覧は「自分の」状態を返すクエリなので、他人の
  // プロフィールを見ているときに取得しても意味が無い(表示もしない)。
  const [mutedUsers, blockedUsers] = isOwnProfile
    ? await Promise.all([getMutedUsers(), getBlockedUsers()])
    : [[], []];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
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

        {isOwnProfile && <AuthorStats works={profile.works} />}

        <ProfileTabs
          postedLabel={`投稿した作品(${profile.works.length})`}
          repostedLabel={`リポストした作品(${profile.repostedWorks.length})`}
          murmursLabel={`つぶやき(${murmurs.length})`}
          showBlockedTab={isOwnProfile}
          postedContent={
            profile.works.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-faint)]">まだ投稿された作品はありません</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          murmursContent={
            murmurs.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-faint)]">まだつぶやきはありません</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
