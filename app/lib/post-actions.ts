"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { postAiEncouragementComment } from "@/app/lib/ai-comment";
import { inferPostType } from "@/app/lib/infer-post-type";
import { getCurrentUser, getOrCreateCurrentUser } from "@/app/lib/session";
import { extractImageFile, saveUploadedImage } from "@/app/lib/upload";
import { extractYouTubeVideoId } from "@/app/lib/youtube";
import type { PostType, Stage } from "@/app/lib/mock-data";
import { prisma } from "@/app/lib/prisma";

export type CreatePostState = { error?: string; success?: boolean; projectId?: string };

// 新規Project作成時の初期stage。投稿から継続的にstageを追従させるのは
// 別スコープ(このマッピングは作成された瞬間の初期値だけを決める)。
function initialStageFor(type: PostType): Stage {
  if (type === "idea" || type === "question") return "アイデア";
  if (type === "release" || type === "update") return "公開中";
  return "プロトタイプ";
}

function deriveTitle(body: string): string {
  return body.length > 24 ? `${body.slice(0, 24)}…` : body;
}

export async function createPost(
  _prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  // 投稿は匿名ゲストの使い捨てアカウントによる荒らし・スパム対策として
  // ログイン必須にした(PostComposerToggle.tsx側のUIガードとは別に、
  // Server Action直接呼び出しへの防御としてここでも検証する)。閲覧・
  // リアクション等は従来通り匿名ゲストのままでも可能。
  const session = await auth();
  if (!session?.user) return { error: "投稿するにはログインが必要です" };

  const body = String(formData.get("body") ?? "").trim();
  const projectTarget = String(formData.get("projectTarget") ?? "");
  const newProjectTitle = String(formData.get("newProjectTitle") ?? "").trim();
  const inspiredByProjectIdRaw = String(formData.get("inspiredByProjectId") ?? "").trim();
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  const imageFile = extractImageFile(formData, "image");

  if (!body && !imageFile && !youtubeUrl) {
    return { error: "本文・画像・YouTubeリンクのいずれかを入力してください" };
  }
  if (body.length > 280) {
    return { error: "280文字以内で入力してください" };
  }
  if (youtubeUrl && !extractYouTubeVideoId(youtubeUrl)) {
    return { error: "YouTube URLの形式が正しくありません" };
  }

  let imageUrl: string | null = null;
  if (imageFile) {
    try {
      imageUrl = await saveUploadedImage(imageFile);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "画像のアップロードに失敗しました" };
    }
  }

  const author = await getOrCreateCurrentUser();

  // 「これにインスパイアされて投稿する」ボタン経由でのみ渡ってくる想定だが、
  // フォーム改ざん対策として実在チェックだけはする(著者チェックは無し、
  // 他人の作品にインスパイアされるのが自然なユースケースのため)。
  const inspiredByProject = inspiredByProjectIdRaw
    ? await prisma.project.findUnique({
        where: { id: inspiredByProjectIdRaw },
        select: { id: true, title: true, authorId: true },
      })
    : null;

  const type = inferPostType(body);
  let projectId: string | null = null;

  if (projectTarget === "new") {
    const project = await prisma.project.create({
      data: {
        // mock-data.tsのProjectは読みやすいローマ字slugだが、投稿から自動生成
        // するものはタイトルの機械的な変換が難しい(日本語のため)ので、opaqueな
        // idで割り切る。
        id: `p-${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        title: newProjectTitle || deriveTitle(body) || "無題の作品",
        catchText: body || "(画像のみの投稿)",
        category: "プロトタイプ",
        stage: initialStageFor(type),
        platforms: ["Web"],
        hue: Math.floor(Math.random() * 360),
        coverImageUrl: imageUrl,
        authorId: author.id,
      },
    });
    projectId = project.id;
  } else if (projectTarget) {
    // フォームの値は自分のProject一覧からしか選べない想定だが、改ざん対策として
    // 実際の所有者と一致する場合だけ紐付ける。一致しなければ孤立Postとして扱う。
    const project = await prisma.project.findUnique({ where: { id: projectTarget } });
    if (project && project.authorId === author.id) {
      projectId = project.id;
    }
  }

  const post = await prisma.post.create({
    data: {
      type,
      body,
      imageUrl,
      youtubeUrl: youtubeUrl || null,
      authorId: author.id,
      projectId,
      inspiredByProjectId: inspiredByProject?.id ?? null,
    },
  });

  // 自分以外の作品にインスパイアされた場合だけ、元の作者に通知する
  // (自分の作品を自分でインスパイア元に指定しても通知は作らない)。
  if (inspiredByProject && inspiredByProject.authorId !== author.id) {
    await prisma.notification.create({
      data: {
        type: "inspired",
        recipientId: inspiredByProject.authorId,
        actorId: author.id,
        sourceProjectId: inspiredByProject.id,
        projectId,
        postId: projectId ? null : post.id,
      },
    });
  }

  if (projectId) {
    // 制作タイムラインの投稿者は常にそのProjectの作者と同一(冒頭の
    // コメント参照)なので、projectAuthorIdはauthor.idでよい。応援コメント
    // 生成はレスポンスをブロックしたくない(将来LLM APIに差し替えたときの
    // レイテンシを考慮)ので、after()でレスポンス送信後に実行する。
    const targetProjectId = projectId;
    const projectAuthorId = author.id;
    after(async () => {
      try {
        await postAiEncouragementComment({
          projectId: targetProjectId,
          projectAuthorId,
          postType: type,
          hasBody: Boolean(body),
          hasImage: Boolean(imageUrl),
        });
        revalidatePath(`/work/${targetProjectId}`);
      } catch (e) {
        console.error("AI応援コメントの投稿に失敗しました", e);
      }
    });
  }

  revalidatePath("/");
  if (projectId) revalidatePath(`/work/${projectId}`);
  if (inspiredByProject) revalidatePath(`/work/${inspiredByProject.id}`);
  return { success: true, projectId: projectId ?? undefined };
}

export type UpdatePostState = { error?: string; success?: boolean };

// 投稿後の軽い編集(誤字修正など)を想定した本文のみの更新。画像の
// 差し替え/削除は今回のスコープ外。つぶやき(projectId無し)・
// 制作タイムライン投稿(projectId有り)はどちらも同じPostモデルなので、
// このActionが両方をカバーする。
export async function updatePost(
  _prevState: UpdatePostState,
  formData: FormData,
): Promise<UpdatePostState> {
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!postId) return { error: "投稿が見つかりません" };
  if (body.length > 280) return { error: "280文字以内で入力してください" };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, imageUrl: true, projectId: true },
  });
  if (!post) return { error: "投稿が見つかりません" };
  if (!body && !post.imageUrl) return { error: "本文か画像のどちらかが必要です" };

  const user = await getCurrentUser();
  if (!user || user.id !== post.authorId) return { error: "権限がありません" };

  await prisma.post.update({ where: { id: postId }, data: { body } });

  if (post.projectId) revalidatePath(`/work/${post.projectId}`);
  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
  return { success: true };
}
