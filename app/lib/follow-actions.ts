"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { isBlockedBy } from "@/app/lib/queries";
import { prisma } from "@/app/lib/prisma";

// トグル: 既にフォローしていればFollow行を消し、していなければ作る。
// authorNameは常に実在するProjectの作者名(=既存User)のはずだが、念のため
// 見つからなければ何もしない。自分自身のフォローも無視する
// (表示名は訪問者ごとに変わるため、名前ではなくidで比較する)。
export async function toggleFollowAction(authorName: string) {
  const [follower, following] = await Promise.all([
    getOrCreateCurrentUser(),
    prisma.user.findUnique({ where: { name: authorName } }),
  ]);
  if (!following || following.id === follower.id) return;

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: follower.id, followingId: following.id } },
  });

  if (existing) {
    // 解除はブロックされていても常に許可する(取り消しなので害が無い)。
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    // ブロックした相手から新しくフォローされる(+フォロー通知が届く)のは
    // ブロックの趣旨に反するため拒否する。
    if (await isBlockedBy(following.id, follower.id)) return;

    await prisma.follow.create({ data: { followerId: follower.id, followingId: following.id } });
    await prisma.notification.create({
      data: { type: "follow", recipientId: following.id, actorId: follower.id },
    });
  }

  // フォロー状態はapp/layout.tsxで全ページ共通に取得しているため、layout単位で無効化する。
  revalidatePath("/", "layout");
}
