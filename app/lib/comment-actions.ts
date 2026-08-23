"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/auth";
import { GUEST_COMMENT_LIMIT } from "@/app/lib/guest-limits";
import { getCurrentUser, getOrCreateCurrentUser } from "@/app/lib/session";
import { extractImageFile, saveUploadedImage, uploadImageErrorMessage } from "@/app/lib/upload";
import { isBlockedBy } from "@/app/lib/queries";
import { isRateLimited } from "@/app/lib/rate-limit";
import { sendCommentNotificationEmail, SITE_URL } from "@/app/lib/email";
import { inferPostType } from "@/app/lib/infer-post-type";
import { prisma } from "@/app/lib/prisma";

// 通知メール送信はレスポンスをブロックしたくない(post-actions.tsの
// postAiEncouragementCommentと同じ理由)のでafter()の中で行い、失敗しても
// コメント投稿自体は成功したままにする(try/catchで握りつぶす)。
async function notifyByEmail(params: {
  recipientId: string;
  actorName: string;
  commentPreview: string;
  targetTitle: string;
  targetUrl: string;
}): Promise<void> {
  try {
    const recipient = await prisma.user.findUnique({
      where: { id: params.recipientId },
      select: { email: true, emailNotificationsEnabled: true, emailVerified: true },
    });
    // 未確認のメールアドレス(他人のアドレスが誤って/悪意で登録された
    // 可能性がある)には送らない。verify-email/route.tsで確認済みにする。
    if (!recipient?.email || !recipient.emailNotificationsEnabled || !recipient.emailVerified) return;

    await sendCommentNotificationEmail({
      to: recipient.email,
      actorName: params.actorName,
      commentPreview: params.commentPreview,
      targetTitle: params.targetTitle,
      targetUrl: params.targetUrl,
    });
  } catch (e) {
    console.error("コメント通知メールの送信に失敗しました", e);
  }
}

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

  // コメントは元々、匿名ゲストの荒らし対策として完全ログイン必須にして
  // いたが、投稿(post-actions.ts createPost)と同様に「試しに使ってみたい」
  // 訪問者の摩擦を減らすため、未ログインでもGUEST_COMMENT_LIMIT件までは
  // コメントできるようにした(CommentForm.tsx側のUIガードとは別に、
  // Server Action直接呼び出しへの防御としてここでも検証する)。
  const session = await auth();

  if (targetType !== "project" && targetType !== "post") return { error: "投稿先が不明です" };
  if (!targetId) return { error: "投稿先が不明です" };
  if (!body && !imageFile) return { error: "コメントか画像のどちらかを入力してください" };
  if (body.length > 500) return { error: "500文字以内で入力してください" };

  let projectId: string | null = null;
  let postId: string | null = null;
  let recipientId: string;
  let targetTitle: string;
  let targetUrl: string;

  if (targetType === "project") {
    const project = await prisma.project.findUnique({
      where: { id: targetId },
      select: { id: true, authorId: true, title: true },
    });
    if (!project) return { error: "作品が見つかりません" };
    projectId = project.id;
    recipientId = project.authorId;
    targetTitle = project.title;
    targetUrl = `${SITE_URL}/work/${project.id}`;
  } else {
    const post = await prisma.post.findUnique({ where: { id: targetId }, select: { id: true, authorId: true, body: true } });
    if (!post) return { error: "投稿が見つかりません" };
    postId = post.id;
    recipientId = post.authorId;
    targetTitle = post.body.length > 30 ? `${post.body.slice(0, 30)}…` : post.body || "投稿";
    targetUrl = `${SITE_URL}/post/${post.id}`;
  }

  const author = await getOrCreateCurrentUser();

  if (!session?.user) {
    const guestCommentCount = await prisma.comment.count({ where: { authorId: author.id } });
    if (guestCommentCount >= GUEST_COMMENT_LIMIT) {
      return { error: `ゲストのコメントは${GUEST_COMMENT_LIMIT}件までです。続けてコメントするにはログインしてください` };
    }
  }

  // 荒らし・スパム対策の簡易レート制限(直近10分に20件まで)。
  const commentLimited = await isRateLimited(
    (since) => prisma.comment.count({ where: { authorId: author.id, createdAt: { gte: since } } }),
    10,
    20,
  );
  if (commentLimited) {
    return { error: "コメントが多すぎます。少し時間をおいてから試してください" };
  }

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
      return { error: uploadImageErrorMessage(e) };
    }
  }

  await prisma.comment.create({
    data: { projectId, postId, parentId, body, imageUrl, authorId: author.id },
  });

  const actorName = author.displayName ?? author.name;

  if (recipientId !== author.id) {
    await prisma.notification.create({
      data: { type: "comment", recipientId, actorId: author.id, projectId, postId },
    });
    after(() => notifyByEmail({ recipientId, actorName, commentPreview: body, targetTitle, targetUrl }));
  }
  // 返信先の作者にも通知する(project/post所有者への上の通知とは別人の
  // 場合のみ。同一人物への二重通知は避ける)。
  if (parentId && replyRecipientId && replyRecipientId !== author.id && replyRecipientId !== recipientId) {
    await prisma.notification.create({
      data: { type: "reply", recipientId: replyRecipientId, actorId: author.id, projectId, postId },
    });
    after(() =>
      notifyByEmail({ recipientId: replyRecipientId, actorName, commentPreview: body, targetTitle, targetUrl }),
    );
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

export type ShareCommentState = { error?: string; success?: boolean; postId?: string };

// 自分のコメントを、そのまま独立したつぶやき(Post)として複製投稿する。
// post-actions.tsのcreatePost(projectTarget未指定=つぶやきの場合)と
// 同じ形のPostを作る。単独投稿へのコメントはinspiredByProjectIdの
// 紐付け先が無いため対象外(CommentThread.tsx側もprojectのコメントに
// しかボタンを出さないが、Server Action直接呼び出しへの防御として
// ここでも弾く)。
export async function shareCommentAsPost(commentId: string): Promise<ShareCommentState> {
  const session = await auth();
  if (!session?.user) return { error: "シェアするにはログインが必要です" };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, body: true, imageUrl: true, projectId: true },
  });
  if (!comment) return { error: "コメントが見つかりません" };

  const user = await getOrCreateCurrentUser();
  if (comment.authorId !== user.id) return { error: "自分のコメントのみシェアできます" };
  if (!comment.projectId) return { error: "この投稿にはシェアできません" };
  if (!comment.body) return { error: "本文のないコメントはシェアできません" };

  // 荒らし・スパム対策の簡易レート制限(createPostと同じ、直近10分に10件まで)。
  const shareLimited = await isRateLimited(
    (since) => prisma.post.count({ where: { authorId: user.id, createdAt: { gte: since } } }),
    10,
    10,
  );
  if (shareLimited) {
    return { error: "投稿が多すぎます。少し時間をおいてから試してください" };
  }

  const project = await prisma.project.findUnique({
    where: { id: comment.projectId },
    select: { id: true, authorId: true },
  });

  const post = await prisma.post.create({
    data: {
      type: inferPostType(comment.body),
      body: comment.body,
      imageUrl: comment.imageUrl,
      authorId: user.id,
      inspiredByProjectId: comment.projectId,
    },
  });

  // 自分以外の作品からのシェアの場合だけ、元の作者に通知する
  // (createPostのインスパイア通知と同じ考え方)。
  if (project && project.authorId !== user.id) {
    await prisma.notification.create({
      data: {
        type: "inspired",
        recipientId: project.authorId,
        actorId: user.id,
        sourceProjectId: project.id,
        postId: post.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath(`/work/${comment.projectId}`);
  return { success: true, postId: post.id };
}
