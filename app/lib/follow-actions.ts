"use server";

import { revalidatePath } from "next/cache";
import { GUEST_USER_NAME } from "@/app/lib/guest-user";
import { prisma } from "@/app/lib/prisma";

// トグル: 既にフォローしていればFollow行を消し、していなければ作る。
// authorNameは常に実在するProjectの作者名(=既存User)のはずだが、念のため
// 見つからなければ何もしない。自分自身のフォローも無視する。
export async function toggleFollowAction(authorName: string) {
  if (authorName === GUEST_USER_NAME) return;

  const [follower, following] = await Promise.all([
    prisma.user.upsert({
      where: { name: GUEST_USER_NAME },
      update: {},
      create: { name: GUEST_USER_NAME },
    }),
    prisma.user.findUnique({ where: { name: authorName } }),
  ]);
  if (!following) return;

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
