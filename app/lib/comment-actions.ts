"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getOrCreateCurrentUser } from "@/app/lib/session";
import { extractImageFile, saveUploadedImage } from "@/app/lib/upload";
import { prisma } from "@/app/lib/prisma";

export type CreateCommentState = { error?: string; success?: boolean };

export async function createComment(
  _prevState: CreateCommentState,
  formData: FormData,
): Promise<CreateCommentState> {
  const projectId = String(formData.get("projectId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const imageFile = extractImageFile(formData, "image");

  if (!projectId) return { error: "投稿先が不明です" };
  if (!body && !imageFile) return { error: "コメントか画像のどちらかを入力してください" };
  if (body.length > 500) return { error: "500文字以内で入力してください" };

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, authorId: true } });
  if (!project) return { error: "作品が見つかりません" };

  let imageUrl: string | null = null;
  if (imageFile) {
    try {
      imageUrl = await saveUploadedImage(imageFile);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "画像のアップロードに失敗しました" };
    }
  }

  const author = await getOrCreateCurrentUser();

  await prisma.comment.create({
    data: { projectId, body, imageUrl, authorId: author.id },
  });

  if (project.authorId !== author.id) {
    await prisma.notification.create({
      data: { type: "comment", recipientId: project.authorId, actorId: author.id, projectId },
    });
  }

  revalidatePath(`/work/${projectId}`);
  // カード側の💬件数表示もこの投稿数を含むため、フィードも合わせて無効化する。
  revalidatePath("/");
  return { success: true };
}

// 自分のコメントはいつでも削除できる(Xと同様、時間制限は設けない)。
export async function deleteComment(commentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, projectId: true },
  });
  if (!comment || comment.authorId !== user.id) return;

  await prisma.comment.delete({ where: { id: commentId } });

  revalidatePath(`/work/${comment.projectId}`);
  revalidatePath("/");
}
