"use client";

import Link from "next/link";
import type { BlockedUserRef, UserRef } from "@/app/lib/queries";
import { toggleBlock, useBlockedUsers } from "@/app/lib/block-store";
import { formatPostedAgo } from "@/app/lib/format";
import { toggleMute, useMutedUsers } from "@/app/lib/mute-store";
import { AuthorAvatar } from "./AuthorAvatar";

function UserRow({
  user,
  daysAgo,
  onRelease,
  label,
}: {
  user: UserRef;
  daysAgo?: number;
  onRelease: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
      <Link href={`/u/${encodeURIComponent(user.name)}`} className="flex min-w-0 flex-1 items-center gap-2">
        <AuthorAvatar name={user.name} size={28} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-[var(--ink)]">{user.name}</p>
          {daysAgo !== undefined && (
            <p className="text-[11px] text-[var(--ink-faint)]">{formatPostedAgo(daysAgo)}にブロック</p>
          )}
        </div>
      </Link>
      <button
        type="button"
        onClick={onRelease}
        className="shrink-0 rounded-full border border-[var(--line)] px-2.5 py-1 text-[11.5px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
      >
        {label}
      </button>
    </div>
  );
}

// 自分のプロフィールページ専用。ミュート/ブロック中のUser一覧を表示し、
// その場で解除できるようにする(toggleMute/toggleBlockは既にトグルなので、
// 「解除する」は同じ関数を再度呼ぶだけでよい)。表示はサーバーから渡された
// 初期一覧をクライアント側ストアの最新状態でフィルタしており、解除すると
// ストアが即座に更新されて行がその場で消える。
export function MutedBlockedList({
  mutedUsers,
  blockedUsers,
}: {
  mutedUsers: UserRef[];
  blockedUsers: BlockedUserRef[];
}) {
  const mutedIds = useMutedUsers();
  const blockedIds = useBlockedUsers();

  const visibleMuted = mutedUsers.filter((u) => mutedIds.has(u.id));
  const visibleBlocked = blockedUsers.filter((u) => blockedIds.has(u.id));

  if (visibleMuted.length === 0 && visibleBlocked.length === 0) {
    return <p className="text-[13px] text-[var(--ink-faint)]">ミュート・ブロック中のユーザーはいません</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {visibleMuted.length > 0 && (
        <div>
          <h2 className="mb-2 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
            ミュート中({visibleMuted.length})
          </h2>
          <div className="flex flex-col gap-0.5">
            {visibleMuted.map((u) => (
              <UserRow key={u.id} user={u} label="解除する" onRelease={() => toggleMute(u.id)} />
            ))}
          </div>
        </div>
      )}
      {visibleBlocked.length > 0 && (
        <div>
          <h2 className="mb-2 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
            ブロック中({visibleBlocked.length})
          </h2>
          <div className="flex flex-col gap-0.5">
            {visibleBlocked.map((u) => (
              <UserRow key={u.id} user={u} daysAgo={u.daysAgo} label="解除する" onRelease={() => toggleBlock(u.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
