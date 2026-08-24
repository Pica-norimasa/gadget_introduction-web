"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { isBlockedBy } from "@/app/lib/queries";
import { prisma } from "@/app/lib/prisma";

async function notifyRepost(projectId: string, actorId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
  if (project && project.authorId !== actorId) {
    await prisma.notification.create({
      data: { type: "repost", recipientId: project.authorId, actorId, projectId },
    });
  }
}

async function notifyPostRepost(postId: string, actorId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (post && post.authorId !== actorId) {
    await prisma.notification.create({
      data: { type: "repost", recipientId: post.authorId, actorId, postId },
    });
  }
}

// トグル: 既にリポスト(引用リポストも含む)していれば取り消し、
// していなければコメント無しのRepost行を作る。FollowButton/ReactionBar
// と同じ、認証無しの軽量セッションUser名義。
export async function toggleRepost(projectId: string) {
  const user = await getOrCreateCurrentUser();

  const existing = await prisma.repost.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });

  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
  } else {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
    if (!project) return;
    if (await isBlockedBy(project.authorId, user.id)) return;

    await prisma.repost.create({ data: { userId: user.id, projectId } });
    await notifyRepost(projectId, user.id);
  }

  revalidatePath("/home");
  revalidatePath(`/work/${projectId}`);
}

// つぶやき(Post)向けのリポスト。Project向けと同じRepostテーブルを使い、
// postIdだけを埋める。引用リポストはまだ作品詳細だけに限定し、
// つぶやきはXの通常リポストに近いシンプルなON/OFFにする。
export async function togglePostRepost(postId: string) {
  const user = await getOrCreateCurrentUser();

  const existing = await prisma.repost.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });

  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
  } else {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (!post) return;
    if (await isBlockedBy(post.authorId, user.id)) return;

    await prisma.repost.create({ data: { userId: user.id, postId } });
    await notifyPostRepost(postId, user.id);
  }

  revalidatePath("/home");
  revalidatePath(`/post/${postId}`);
}

export type QuoteRepostState = { error?: string; success?: boolean };

// 引用リポスト: 既存のRepost行(あれば)にコメントを足す/上書きする形で
// upsertする。1ユーザー1Projectあたり1行の制約はtoggleRepostと共通。
export async function quoteRepost(
  _prevState: QuoteRepostState,
  formData: FormData,
): Promise<QuoteRepostState> {
  const projectId = String(formData.get("projectId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!projectId) return { error: "作品が見つかりません" };
  if (!comment) return { error: "コメントを入力してください" };
  if (comment.length > 200) return { error: "200文字以内で入力してください" };

  const user = await getOrCreateCurrentUser();

  const existing = await prisma.repost.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
  });

  // 新規リポストだけブロックの対象にする(既存の引用コメントの書き直しは
  // ブロックされる前からの自分の行動なので縛らない)。
  if (!existing) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
    if (!project) return { error: "作品が見つかりません" };
    if (await isBlockedBy(project.authorId, user.id)) return { error: "この作品は紹介できません" };
  }

  await prisma.repost.upsert({
    where: { userId_projectId: { userId: user.id, projectId } },
    update: { comment },
    create: { userId: user.id, projectId, comment },
  });
  // 既存行の更新(コメントの書き直し)では通知を作らない。「リポストされた」
  // という事実は最初の1回だけ知らせれば十分なため。
  if (!existing) await notifyRepost(projectId, user.id);

  revalidatePath("/home");
  revalidatePath(`/work/${projectId}`);
  return { success: true };
}
