"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import type { ReactionKey } from "@/app/lib/mock-data";
import { prisma } from "@/app/lib/prisma";

// トグル: 既に押していれば取り消し、押していなければReaction行を作る。
// 認証が無いので軽量セッション(app/lib/session.ts)のUser名義で行う。
export async function toggleReaction(projectId: string, type: ReactionKey) {
  const user = await getOrCreateCurrentUser();

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
