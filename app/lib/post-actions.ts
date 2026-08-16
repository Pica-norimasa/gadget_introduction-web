"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { postAiEncouragementComment } from "@/app/lib/ai-comment";
import { inferPostType } from "@/app/lib/infer-post-type";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { extractImageFile, saveUploadedImage } from "@/app/lib/upload";
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
  const body = String(formData.get("body") ?? "").trim();
  const projectTarget = String(formData.get("projectTarget") ?? "");
  const newProjectTitle = String(formData.get("newProjectTitle") ?? "").trim();
  const imageFile = extractImageFile(formData, "image");

  if (!body && !imageFile) {
    return { error: "本文か画像のどちらかを入力してください" };
  }
  if (body.length > 280) {
    return { error: "280文字以内で入力してください" };
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

  await prisma.post.create({
    data: {
      type,
      body,
      imageUrl,
      authorId: author.id,
      projectId,
    },
  });

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
  return { success: true, projectId: projectId ?? undefined };
}
