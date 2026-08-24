"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { postAiEncouragementComment } from "@/app/lib/ai-comment";
import { inferPostType } from "@/app/lib/infer-post-type";
import { GUEST_POST_LIMIT } from "@/app/lib/guest-limits";
import { getCurrentUser, getOrCreateCurrentUser } from "@/app/lib/session";
import { extractImageFile, saveUploadedImage, uploadImageErrorMessage } from "@/app/lib/upload";
import { extractYouTubeVideoId } from "@/app/lib/youtube";
import { isRateLimited } from "@/app/lib/rate-limit";
import type { ExperienceType, PostType, Stage } from "@/app/lib/mock-data";
import { prisma } from "@/app/lib/prisma";

export type CreatePostState = { error?: string; success?: boolean; projectId?: string; postId?: string };

const POST_TYPES = ["idea", "making", "screenshot", "demo", "prototype", "release", "update", "question"] as const;

function isPostType(value: string): value is PostType {
  return POST_TYPES.includes(value as PostType);
}

const EXPERIENCE_TYPES = ["trying", "success", "failure", "learning"] as const;

function isExperienceType(value: string): value is ExperienceType {
  return (EXPERIENCE_TYPES as readonly string[]).includes(value);
}

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
  // 投稿は元々、匿名ゲストの使い捨てアカウントによる荒らし・スパム対策
  // として完全ログイン必須にしていたが、「試しに使ってみたい」訪問者の
  // 摩擦を減らすため、未ログインでもGUEST_POST_LIMIT件までは投稿できる
  // ようにした(PostComposerToggle.tsx側のUIガードとは別に、Server Action
  // 直接呼び出しへの防御としてここでも検証する)。ゲストの正体はCookieだけ
  // なので、Cookieを消せば上限はリセットできてしまうが、あくまで初回体験の
  // ハードルを下げるためのものと割り切り、本格的な荒らし対策は下の
  // レート制限に任せる。
  const session = await auth();

  const body = String(formData.get("body") ?? "").trim();
  const projectTarget = String(formData.get("projectTarget") ?? "");
  const newProjectTitle = String(formData.get("newProjectTitle") ?? "").trim();
  const inspiredByProjectIdRaw = String(formData.get("inspiredByProjectId") ?? "").trim();
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  const postTypeRaw = String(formData.get("postType") ?? "").trim();
  const experienceTypeRaw = String(formData.get("experienceType") ?? "").trim();
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
  if (newProjectTitle.length > 40) {
    return { error: "プロジェクト名は40文字以内で入力してください" };
  }

  let imageUrl: string | null = null;
  if (imageFile) {
    try {
      imageUrl = await saveUploadedImage(imageFile);
    } catch (e) {
      return { error: uploadImageErrorMessage(e) };
    }
  }

  const author = await getOrCreateCurrentUser();

  if (!session?.user) {
    const guestPostCount = await prisma.post.count({ where: { authorId: author.id } });
    if (guestPostCount >= GUEST_POST_LIMIT) {
      return { error: `ゲストの投稿は${GUEST_POST_LIMIT}件までです。続けて投稿するにはログインしてください` };
    }
  }

  // 荒らし・スパム対策の簡易レート制限(直近10分に10件まで)。
  const limited = await isRateLimited(
    (since) => prisma.post.count({ where: { authorId: author.id, createdAt: { gte: since } } }),
    10,
    10,
  );
  if (limited) {
    return { error: "投稿が多すぎます。少し時間をおいてから試してください" };
  }

  // 「これにインスパイアされて投稿する」ボタン経由でのみ渡ってくる想定だが、
  // フォーム改ざん対策として実在チェックだけはする(著者チェックは無し、
  // 他人の作品にインスパイアされるのが自然なユースケースのため)。
  const inspiredByProject = inspiredByProjectIdRaw
    ? await prisma.project.findUnique({
        where: { id: inspiredByProjectIdRaw },
        select: { id: true, title: true, authorId: true },
      })
    : null;

  const type = isPostType(postTypeRaw) ? postTypeRaw : inferPostType(body);
  let projectId: string | null = null;
  // 新規Projectは常にaiCommentsEnabled: true(schemaのデフォルト)で
  // 作られるため、既存Projectに投稿する場合だけそのProjectの設定を見る。
  let aiCommentsEnabled = true;

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
    // オーナー本人、またはオーナーに追加された参加メンバーだけが
    // 既存Projectの制作タイムラインに投稿できる。改ざんされたprojectIdは
    // 孤立Postに落とさず、権限エラーとして返して誤投稿を防ぐ。
    const project = await prisma.project.findUnique({
      where: { id: projectTarget },
      select: {
        id: true,
        authorId: true,
        aiCommentsEnabled: true,
        members: { where: { userId: author.id }, select: { id: true } },
      },
    });
    if (project && (project.authorId === author.id || project.members.length > 0)) {
      projectId = project.id;
      aiCommentsEnabled = project.aiCommentsEnabled;
    } else {
      return { error: "この作品の制作タイムラインには投稿できません" };
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
      experienceType: isExperienceType(experienceTypeRaw) ? experienceTypeRaw : null,
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

  if (projectId && aiCommentsEnabled) {
    // 参加メンバーの投稿でも、AI応援コメントの宛先はProjectのオーナー。
    // 生成はレスポンスをブロックしたくない(将来LLM APIに差し替えたときの
    // レイテンシを考慮)ので、after()でレスポンス送信後に実行する。
    const targetProjectId = projectId;
    const projectAuthorId =
      projectTarget && projectTarget !== "new"
        ? ((await prisma.project.findUnique({ where: { id: targetProjectId }, select: { authorId: true } }))?.authorId ??
          author.id)
        : author.id;
    after(async () => {
      try {
        await postAiEncouragementComment({
          projectId: targetProjectId,
          projectAuthorId,
          postType: type,
          hasBody: Boolean(body),
          hasImage: Boolean(imageUrl),
          postBody: body,
        });
        revalidatePath(`/work/${targetProjectId}`);
      } catch (e) {
        console.error("AI応援コメントの投稿に失敗しました", e);
      }
    });
  }

  revalidatePath("/home");
  if (projectId) revalidatePath(`/work/${projectId}`);
  if (inspiredByProject) revalidatePath(`/work/${inspiredByProject.id}`);
  return { success: true, projectId: projectId ?? undefined, postId: post.id };
}

export type UpdatePostState = { error?: string; success?: boolean };

// 投稿後の軽い編集(誤字修正・画像/YouTubeリンクの差し替え)。つぶやき
// (projectId無し)・制作タイムライン投稿(projectId有り)はどちらも同じ
// Postモデルなので、このActionが両方をカバーする。画像は新しいファイルが
// 来ていればそれに差し替え、無ければremoveImageフラグの有無で「維持」か
// 「削除」かを判断する(何も送らない=変更なし、が既定)。
export async function updatePost(
  _prevState: UpdatePostState,
  formData: FormData,
): Promise<UpdatePostState> {
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const youtubeUrlRaw = String(formData.get("youtubeUrl") ?? "").trim();
  const removeImage = formData.get("removeImage") === "1";
  const imageFile = extractImageFile(formData, "image");
  const typeRaw = formData.get("type");
  const type = typeof typeRaw === "string" && isPostType(typeRaw) ? typeRaw : null;
  // experienceTypeはtypeと違って必須項目ではないため、フォームに欄自体が
  // 無かった(=PostEditorにtype propが渡っていないpost/[id]の文脈)場合は
  // 何もしないが、欄はあって空(=「未設定」を選んだ)場合は明示的にnullへ
  // クリアする。「送られてきたかどうか」と「値が入っているか」を区別する
  // 必要があるため、typeのような単純な三項演算だけでは書けない。
  const experienceTypeRaw = formData.get("experienceType");
  const experienceTypeProvided = experienceTypeRaw !== null;
  const experienceType =
    typeof experienceTypeRaw === "string" && isExperienceType(experienceTypeRaw) ? experienceTypeRaw : null;

  if (!postId) return { error: "投稿が見つかりません" };
  if (body.length > 280) return { error: "280文字以内で入力してください" };
  if (youtubeUrlRaw && !extractYouTubeVideoId(youtubeUrlRaw)) {
    return { error: "YouTube URLの形式が正しくありません" };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, imageUrl: true, projectId: true },
  });
  if (!post) return { error: "投稿が見つかりません" };

  const user = await getCurrentUser();
  if (!user || user.id !== post.authorId) return { error: "権限がありません" };

  let imageUrl = post.imageUrl;
  if (imageFile) {
    try {
      imageUrl = await saveUploadedImage(imageFile);
    } catch (e) {
      return { error: uploadImageErrorMessage(e) };
    }
  } else if (removeImage) {
    imageUrl = null;
  }

  const youtubeUrl = youtubeUrlRaw || null;
  if (!body && !imageUrl && !youtubeUrl) {
    return { error: "本文・画像・YouTubeリンクのいずれかが必要です" };
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      body,
      imageUrl,
      youtubeUrl,
      ...(type ? { type } : {}),
      ...(experienceTypeProvided ? { experienceType } : {}),
    },
  });

  if (post.projectId) revalidatePath(`/work/${post.projectId}`);
  revalidatePath(`/post/${postId}`);
  revalidatePath("/home");
  return { success: true };
}
