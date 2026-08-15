"use server";

import { revalidatePath } from "next/cache";
import { GUEST_USER_NAME } from "@/app/lib/guest-user";
import type { ReactionKey } from "@/app/lib/mock-data";
import { prisma } from "@/app/lib/prisma";

// トグル: 既に押していれば取り消し、押していなければReaction行を作る。
// 認証が無いのでGUEST_USER_NAME名義で行う(post-actions.tsと同じ割り切り)。
export async function toggleReaction(projectId: string, type: ReactionKey) {
  const user = await prisma.user.upsert({
    where: { name: GUEST_USER_NAME },
    update: {},
    create: { name: GUEST_USER_NAME },
  });

  const existing = await prisma.reaction.findUnique({
    where: { projectId_userId_type: { projectId, userId: user.id, type } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { projectId, userId: user.id, type } });
  }

  revalidatePath("/");
  revalidatePath(`/work/${projectId}`);
}
