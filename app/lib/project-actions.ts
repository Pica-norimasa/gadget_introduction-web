"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/session";
import { extractImageFile, saveUploadedImage } from "@/app/lib/upload";
import { extractYouTubeVideoId } from "@/app/lib/youtube";
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
];

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

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { authorId: true } });
  if (!project || project.authorId !== user.id) return { error: "権限がありません" };

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
    },
  });

  revalidatePath(`/work/${projectId}`);
  revalidatePath("/");
  redirect(`/work/${projectId}`);
}
