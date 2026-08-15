"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
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
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { followerId: follower.id, followingId: following.id } });
  }

  // フォロー状態はapp/layout.tsxで全ページ共通に取得しているため、layout単位で無効化する。
  revalidatePath("/", "layout");
}
