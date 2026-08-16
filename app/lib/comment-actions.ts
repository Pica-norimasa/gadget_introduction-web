"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

export type CreateCommentState = { error?: string; success?: boolean };

export async function createComment(
  _prevState: CreateCommentState,
  formData: FormData,
): Promise<CreateCommentState> {
  const projectId = String(formData.get("projectId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!projectId) return { error: "投稿先が不明です" };
  if (!body) return { error: "コメントを入力してください" };
  if (body.length > 500) return { error: "500文字以内で入力してください" };

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) return { error: "作品が見つかりません" };

  const author = await getOrCreateCurrentUser();

  await prisma.comment.create({
    data: { projectId, body, authorId: author.id },
  });

  revalidatePath(`/work/${projectId}`);
  // カード側の💬件数表示もこの投稿数を含むため、フィードも合わせて無効化する。
  revalidatePath("/");
  return { success: true };
}
