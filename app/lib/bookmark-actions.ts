"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

// トグル: 既にブックマーク済みなら取り消し、していなければBookmark行を作る。
// リアクションと違い、これは自分だけの非公開の「あとで見る」保存なので、
// 相手への通知は作らない・トレンドスコアにも影響させない(レート制限も不要)。
export async function toggleBookmark(target: { type: "project" | "post"; id: string }): Promise<void> {
  const user = await getOrCreateCurrentUser();

  const existing =
    target.type === "project"
      ? await prisma.bookmark.findUnique({
          where: { projectId_userId: { projectId: target.id, userId: user.id } },
        })
      : await prisma.bookmark.findUnique({
          where: { postId_userId: { postId: target.id, userId: user.id } },
        });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({
      data: {
        userId: user.id,
        projectId: target.type === "project" ? target.id : null,
        postId: target.type === "post" ? target.id : null,
      },
    });
  }

  revalidatePath(target.type === "project" ? `/work/${target.id}` : `/post/${target.id}`);
  revalidatePath("/");
}
