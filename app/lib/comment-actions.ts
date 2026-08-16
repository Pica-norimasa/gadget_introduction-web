"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, getOrCreateCurrentUser } from "@/app/lib/session";
import { extractImageFile, saveUploadedImage } from "@/app/lib/upload";
import { isBlockedBy } from "@/app/lib/queries";
import { prisma } from "@/app/lib/prisma";

export type CreateCommentState = { error?: string; success?: boolean };

// targetType/targetIdはCommentForm.tsxが渡す。project(通常の作品)と
// post(プロジェクトに紐づかない単独投稿)のどちらにもコメントできる
// ようにするための、Reportモデルと同じポリモーフィックな考え方。
export async function createComment(
  _prevState: CreateCommentState,
  formData: FormData,
): Promise<CreateCommentState> {
  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();
  const imageFile = extractImageFile(formData, "image");

  if (targetType !== "project" && targetType !== "post") return { error: "投稿先が不明です" };
  if (!targetId) return { error: "投稿先が不明です" };
  if (!body && !imageFile) return { error: "コメントか画像のどちらかを入力してください" };
  if (body.length > 500) return { error: "500文字以内で入力してください" };

  let projectId: string | null = null;
  let postId: string | null = null;
  let recipientId: string;

  if (targetType === "project") {
    const project = await prisma.project.findUnique({ where: { id: targetId }, select: { id: true, authorId: true } });
    if (!project) return { error: "作品が見つかりません" };
    projectId = project.id;
    recipientId = project.authorId;
  } else {
    const post = await prisma.post.findUnique({ where: { id: targetId }, select: { id: true, authorId: true } });
    if (!post) return { error: "投稿が見つかりません" };
    postId = post.id;
    recipientId = post.authorId;
  }

  const author = await getOrCreateCurrentUser();

  // ミュート/ブロックは今まで「自分の画面から相手を消す」だけで、相手が
  // 実際に書き込むこと自体は防げていなかった。ブロックされている側からの
  // 新規コメントはここで拒否する。
  if (await isBlockedBy(recipientId, author.id)) {
    return { error: "この投稿にはコメントできません" };
  }

  // 返信先(あれば)は今回のtarget(project/post)と同じスレッドに属して
  // いる場合のみ信用する(改ざん対策)。「返信への返信」はUIがボタンを
  // 出さないだけで、データ上は弾いていない(親を辿らせる複雑さを避ける
  // ため、フラットな1階層として扱う)。
  let parentId: string | null = null;
  let replyRecipientId: string | null = null;
  if (parentIdRaw) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentIdRaw },
      select: { id: true, authorId: true, projectId: true, postId: true },
    });
    if (parent && parent.projectId === projectId && parent.postId === postId) {
      parentId = parent.id;
      replyRecipientId = parent.authorId;
    }
  }

  let imageUrl: string | null = null;
  if (imageFile) {
    try {
      imageUrl = await saveUploadedImage(imageFile);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "画像のアップロードに失敗しました" };
    }
  }

  await prisma.comment.create({
    data: { projectId, postId, parentId, body, imageUrl, authorId: author.id },
  });

  if (recipientId !== author.id) {
    await prisma.notification.create({
      data: { type: "comment", recipientId, actorId: author.id, projectId, postId },
    });
  }
  // 返信先の作者にも通知する(project/post所有者への上の通知とは別人の
  // 場合のみ。同一人物への二重通知は避ける)。
  if (parentId && replyRecipientId && replyRecipientId !== author.id && replyRecipientId !== recipientId) {
    await prisma.notification.create({
      data: { type: "reply", recipientId: replyRecipientId, actorId: author.id, projectId, postId },
    });
  }

  if (projectId) revalidatePath(`/work/${projectId}`);
  if (postId) revalidatePath(`/post/${postId}`);
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
    select: { authorId: true, projectId: true, postId: true },
  });
  if (!comment || comment.authorId !== user.id) return;

  await prisma.comment.delete({ where: { id: commentId } });

  if (comment.projectId) revalidatePath(`/work/${comment.projectId}`);
  if (comment.postId) revalidatePath(`/post/${comment.postId}`);
  revalidatePath("/");
}
