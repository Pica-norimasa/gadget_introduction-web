"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

// トグル: 既にリポストしていれば取り消し、していなければRepost行を作る。
// FollowButton/ReactionBarと同じ、認証無しの軽量セッションUser名義。
export async function toggleRepost(projectId: string) {
  const user = await getOrCreateCurrentUser();

  const existing = await prisma.repost.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });

  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
  } else {
    await prisma.repost.create({ data: { userId: user.id, projectId } });

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
    if (project && project.authorId !== user.id) {
      await prisma.notification.create({
        data: { type: "repost", recipientId: project.authorId, actorId: user.id, projectId },
      });
    }
  }

  revalidatePath("/");
  revalidatePath(`/work/${projectId}`);
}
