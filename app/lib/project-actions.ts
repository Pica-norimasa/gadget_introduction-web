"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { extractImageFile, saveUploadedImage } from "@/app/lib/upload";
import { extractYouTubeVideoId } from "@/app/lib/youtube";
import { sendStageUpNotificationEmail, SITE_URL } from "@/app/lib/email";
import { prisma } from "@/app/lib/prisma";
import type { AiTool, Category, Platform, Stage } from "@/app/lib/mock-data";

export type UpdateProjectState = { error?: string };

const CATEGORIES: Category[] = [
  "Webアプリ",
  "スマホアプリ",
  "PCアプリ",
  "ゲーム",
  "AIツール",
  "AI Agent",
  "拡張機能",
  "プロトタイプ",
  "その他",
];
const STAGES: Stage[] = ["アイデア", "プロトタイプ", "ベータ", "公開中"];
const TOOLS: Exclude<AiTool, null>[] = [
  "Claude",
  "ChatGPT",
  "Gemini",
  "Bolt",
  "v0",
  "Cursor",
  "self",
  "multiple",
];
const PLATFORMS: Platform[] = [
  "iOS",
  "Android",
  "Windows",
  "macOS",
  "Linux",
  "Web",
  "拡張機能",
  "Unity",
  "Unreal Engine",
  "その他",
];

// 「公開中」に到達した作者のフォロワーへ一斉メール通知する。レスポンスを
// ブロックしたくないのでafter()の中で行い、失敗しても保存自体は成功した
// ままにする(comment-actions.tsのnotifyByEmailと同じ方針)。1人ずつの
// 送信失敗が他のフォロワーへの送信を止めないようallSettledを使う。
async function notifyFollowersOfRelease(params: {
  authorId: string;
  authorName: string;
  projectId: string;
  projectTitle: string;
}): Promise<void> {
  try {
    const followers = await prisma.follow.findMany({
      where: {
        followingId: params.authorId,
        follower: { email: { not: null }, emailNotificationsEnabled: true, emailVerified: { not: null } },
      },
      select: { follower: { select: { email: true } } },
    });
    const projectUrl = `${SITE_URL}/work/${params.projectId}`;
    await Promise.allSettled(
      followers.map((f) =>
        sendStageUpNotificationEmail({
          to: f.follower.email!,
          authorName: params.authorName,
          projectTitle: params.projectTitle,
          projectUrl,
        }),
      ),
    );
  } catch (e) {
    console.error("ステージアップ通知メールの送信に失敗しました", e);
  }
}

export async function updateProject(
  _prevState: UpdateProjectState,
  formData: FormData,
): Promise<UpdateProjectState> {
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const catchText = String(formData.get("catchText") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const stage = String(formData.get("stage") ?? "");
  const toolRaw = String(formData.get("tool") ?? "");
  const tool = toolRaw === "" ? null : toolRaw;
  const glyph = String(formData.get("glyph") ?? "").trim();
  const githubUrl = String(formData.get("githubUrl") ?? "").trim();
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  const appStoreUrl = String(formData.get("appStoreUrl") ?? "").trim();
  const googlePlayUrl = String(formData.get("googlePlayUrl") ?? "").trim();
  const platforms = formData.getAll("platforms").map(String);
  const coverImageFile = extractImageFile(formData, "image");
  const removeCoverImage = formData.get("removeCoverImage") === "1";

  if (!projectId) return { error: "作品が見つかりません" };
  if (!title) return { error: "タイトルを入力してください" };
  if (title.length > 40) return { error: "タイトルは40文字以内で入力してください" };
  if (!catchText) return { error: "説明文を入力してください" };
  if (catchText.length > 200) return { error: "説明文は200文字以内で入力してください" };
  if (!CATEGORIES.includes(category as Category)) return { error: "カテゴリが不正です" };
  if (!STAGES.includes(stage as Stage)) return { error: "ステージが不正です" };
  if (tool !== null && !TOOLS.includes(tool as Exclude<AiTool, null>)) return { error: "ツールが不正です" };
  if (glyph.length > 4) return { error: "アイコンは4文字以内で入力してください" };
  if (githubUrl && !/^https:\/\/github\.com\/.+/.test(githubUrl)) {
    return { error: "GitHub URLの形式が正しくありません(https://github.com/... の形にしてください)" };
  }
  if (youtubeUrl && !extractYouTubeVideoId(youtubeUrl)) {
    return { error: "YouTube URLの形式が正しくありません" };
  }
  if (appStoreUrl && !/^https:\/\/apps\.apple\.com\/.+/.test(appStoreUrl)) {
    return { error: "App Store URLの形式が正しくありません(https://apps.apple.com/... の形にしてください)" };
  }
  if (googlePlayUrl && !/^https:\/\/play\.google\.com\/.+/.test(googlePlayUrl)) {
    return { error: "Google Play URLの形式が正しくありません(https://play.google.com/... の形にしてください)" };
  }
  if (platforms.length === 0) return { error: "対応環境を1つ以上選んでください" };
  if (!platforms.every((p) => PLATFORMS.includes(p as Platform))) return { error: "対応環境が不正です" };

  const user = await getCurrentUser();
  if (!user) return { error: "権限がありません" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { authorId: true, stage: true },
  });
  if (!project || project.authorId !== user.id) return { error: "権限がありません" };

  // ステージが前進した(アイデア→プロトタイプ→ベータ→公開中)ときだけ
  // stageChangedAtを更新する。ホームの「昇格おめでとう」ポップアップは
  // これを見て直近の前進を検出するので、後退・据え置きの保存では
  // 反応させない。
  const stageAdvanced = STAGES.indexOf(stage as Stage) > STAGES.indexOf(project.stage as Stage);

  // undefinedのままなら既存のcoverImageUrlに触れない。新規アップロードが
  // あれば差し替え、明示的な削除(removeCoverImage)ならnullにする。
  let coverImageUrl: string | null | undefined;
  if (coverImageFile) {
    try {
      coverImageUrl = await saveUploadedImage(coverImageFile);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "画像のアップロードに失敗しました" };
    }
  } else if (removeCoverImage) {
    coverImageUrl = null;
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      title,
      catchText,
      category,
      stage,
      tool,
      glyph: glyph || null,
      githubUrl: githubUrl || null,
      youtubeUrl: youtubeUrl || null,
      appStoreUrl: appStoreUrl || null,
      googlePlayUrl: googlePlayUrl || null,
      platforms,
      ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
      ...(stageAdvanced ? { stageChangedAt: new Date() } : {}),
    },
  });

  if (stageAdvanced && stage === "公開中") {
    const authorName = user.displayName ?? user.name;
    after(() => notifyFollowersOfRelease({ authorId: user.id, authorName, projectId, projectTitle: title }));
  }

  revalidatePath(`/work/${projectId}`);
  revalidatePath("/");
  redirect(`/work/${projectId}`);
}

// EmailNotificationToggle.tsxと同じ、楽観トグルの裏側で呼ぶだけの最小構成。
export async function setAiCommentsEnabled(projectId: string, enabled: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
  if (!project || project.authorId !== user.id) return;

  await prisma.project.update({ where: { id: projectId }, data: { aiCommentsEnabled: enabled } });
  revalidatePath(`/work/${projectId}`);
}

export type DeleteProjectState = { error?: string };

// 作品の完全削除。schema.prismaのFK制約はほとんどON DELETE SET NULLに
// なっている(Post.projectId等)ため、何もせずprisma.project.delete()だけ
// 呼ぶと、タイムライン投稿が孤立したつぶやきとして残ったり、コメント/
// リアクション/ブックマーク/通知/通報が対象を失ったまま残ってしまう
// (実際にマイグレーションSQLを確認して判明)。Repost.projectIdだけは
// ON DELETE RESTRICTなので、先に消さないとdelete自体が失敗する。
// そのため、依存する行を子→親の順に明示的に消してから最後にProject本体を
// 消す。inspiredByProjectId(このProjectを「インスパイア元」として参照する
// 他人の投稿)だけはON DELETE SET NULLのままでよい(投稿自体は無関係な
// コンテンツなので消さず、参照だけ外れれば十分)。
export async function deleteProject(
  _prevState: DeleteProjectState,
  formData: FormData,
): Promise<DeleteProjectState> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { error: "作品が見つかりません" };

  const user = await getCurrentUser();
  if (!user) return { error: "権限がありません" };

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
  if (!project || project.authorId !== user.id) return { error: "権限がありません" };

  const posts = await prisma.post.findMany({ where: { projectId }, select: { id: true } });
  const postIds = posts.map((p) => p.id);
  const postOr = postIds.length > 0 ? [{ postId: { in: postIds } }] : [];

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { OR: [{ projectId }, ...postOr] } }),
    prisma.reaction.deleteMany({ where: { OR: [{ projectId }, ...postOr] } }),
    prisma.bookmark.deleteMany({ where: { OR: [{ projectId }, ...postOr] } }),
    prisma.notification.deleteMany({ where: { OR: [{ projectId }, { sourceProjectId: projectId }, ...postOr] } }),
    prisma.report.deleteMany({ where: { OR: [{ projectId }, ...postOr] } }),
    prisma.repost.deleteMany({ where: { projectId } }),
    prisma.post.deleteMany({ where: { projectId } }),
    prisma.project.delete({ where: { id: projectId } }),
  ]);

  revalidatePath("/");
  redirect("/");
}
