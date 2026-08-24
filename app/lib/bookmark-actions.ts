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
    // 削除済みの作品/投稿IDが渡された場合(古い画面が残っていた等)に
    // FK制約エラーでクラッシュしないよう、他のトグル系アクション
    // (reaction-actions.ts、repost-actions.ts)と同じく存在確認してから作る。
    const exists =
      target.type === "project"
        ? await prisma.project.findUnique({ where: { id: target.id }, select: { id: true } })
        : await prisma.post.findUnique({ where: { id: target.id }, select: { id: true } });
    if (!exists) return;

    await prisma.bookmark.create({
      data: {
        userId: user.id,
        projectId: target.type === "project" ? target.id : null,
        postId: target.type === "post" ? target.id : null,
      },
    });
  }

  revalidatePath(target.type === "project" ? `/work/${target.id}` : `/post/${target.id}`);
  revalidatePath("/home");
}
