import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyReactions, getPosts, getUserProfile } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { AuthorAvatar } from "@/app/components/AuthorAvatar";
import { BioEditor } from "@/app/components/BioEditor";
import { FollowButton } from "@/app/components/FollowButton";
import { SiteHeader } from "@/app/components/SiteHeader";
import { WorkCard } from "@/app/components/WorkCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const profile = await getUserProfile(decodeURIComponent(name));
  if (!profile) return { title: "ユーザーが見つかりません | Draftly" };
  return { title: `${profile.name} | Draftly` };
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

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-start gap-3">
          <AuthorAvatar name={profile.name} size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
              {profile.name}
            </h1>
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
          {!isOwnProfile && <FollowButton author={profile.name} size="md" />}
        </div>

        <h2 className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
          投稿した作品({profile.works.length})
        </h2>
        {profile.works.length === 0 ? (
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
        )}
      </main>
    </div>
  );
}
