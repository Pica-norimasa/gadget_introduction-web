import Link from "next/link";
import type { FollowedUserRef } from "@/app/lib/queries";
import { AuthorAvatar } from "./AuthorAvatar";
import { FollowButton } from "./FollowButton";

// プロフィールページの「フォロー中」タブ。MutedBlockedList.tsxと違い、
// 誰のプロフィールを見ていても表示する公開情報なので、自分の関係だけを
// 反映するミュート/ブロックストアのようなクライアント側フィルタは無い。
// 各行のFollowButtonは「このプロフィールの持ち主」ではなく「閲覧者自身」の
// フォロー状態を表すので、他人のフォロー中一覧から新しい作者を見つけて
// その場でフォローすることもできる。
export function FollowingList({ users }: { users: FollowedUserRef[] }) {
  if (users.length === 0) {
    return <p className="text-[13px] text-[var(--ink-faint)]">まだ誰もフォローしていません</p>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <Link href={`/u/${encodeURIComponent(user.name)}`} className="flex min-w-0 flex-1 items-center gap-2.5">
            <AuthorAvatar name={user.displayName} image={user.image} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-[var(--ink)]">{user.displayName}</p>
              <p className="truncate text-[12px] text-[var(--ink-faint)]">{user.bio || `@${user.name}`}</p>
            </div>
          </Link>
          <FollowButton author={user.name} />
        </div>
      ))}
    </div>
  );
}
