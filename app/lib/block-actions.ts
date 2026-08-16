"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

// トグル: 既にブロックしていれば取り消し、していなければBlock行を作る。
// ブロック開始時は相互フォローも解消する(ミュートには無い、ブロック
// 固有の効果)。
export async function toggleBlock(blockedId: string) {
  const user = await getOrCreateCurrentUser();
  if (blockedId === user.id) return;

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
  });

  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
  } else {
    await prisma.block.create({ data: { blockerId: user.id, blockedId } });
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: user.id, followingId: blockedId },
          { followerId: blockedId, followingId: user.id },
        ],
      },
    });
  }

  revalidatePath("/", "layout");
}
