import Link from "next/link";
import type { ExperiencePostView } from "@/app/lib/queries";
import { formatRelativeHours } from "@/app/lib/format";
import { AuthorAvatar } from "./AuthorAvatar";
import { ExpandablePostBody } from "./ExpandablePostBody";
import { ExperienceTypeBadge } from "./ExperienceTypeBadge";
import { VerifiedBadge } from "./VerifiedBadge";

// 「みんなの経験値」ページの各タブで共通して使う投稿カード。制作
// タイムライン上の1投稿を、その投稿がどの作品のものかが分かる形で
// 単独表示する(StandalonePostCard.tsxは単独投稿=Project無し専用の
// ため流用できず、こちらは常にprojectId/projectTitleを持つ前提)。
export function ExperiencePostCard({
  post,
  helpfulCount,
}: {
  post: ExperiencePostView;
  helpfulCount?: number;
}) {
  return (
    <div className="relative flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 hover:border-[var(--accent)]">
      <Link href={`/work/${post.projectId}`} aria-label={post.projectTitle} className="absolute inset-0 z-10" />
      <AuthorAvatar name={post.authorName} image={post.authorImage} size={28} />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[12px] text-[var(--ink-faint)]">
          <span className="font-medium text-[var(--ink-soft)]">{post.authorName}</span>
          {post.authorVerified && <VerifiedBadge className="ml-1 inline-block align-[-1px]" />}{" "}
          {post.authorSocialHandle && <span>@{post.authorSocialHandle}</span>} ・ {formatRelativeHours(post.hoursAgo)}
        </p>
        <p className="mb-1.5 truncate text-[12px] text-[var(--ink-faint)]">📁 {post.projectTitle}</p>
        {post.body && <ExpandablePostBody text={post.body} />}
        <div className="relative z-20 mt-2 flex flex-wrap items-center gap-1.5">
          {post.experienceType && <ExperienceTypeBadge type={post.experienceType} className="text-[11px]" />}
          {helpfulCount !== undefined && helpfulCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full font-mono text-[11px] text-[var(--teal)]">
              📖 参考になった {helpfulCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
