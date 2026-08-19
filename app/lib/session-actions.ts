"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { extractImageFile, saveUploadedImage } from "@/app/lib/upload";
import { prisma } from "@/app/lib/prisma";

export type UpdateNameState = { error?: string; success?: boolean };

export async function updateDisplayName(
  _prevState: UpdateNameState,
  formData: FormData,
): Promise<UpdateNameState> {
  const displayName = String(formData.get("name") ?? "").trim();
  if (!displayName) return { error: "名前を入力してください" };
  if (displayName.length > 20) return { error: "20文字以内で入力してください" };

  const user = await getOrCreateCurrentUser();
  if (displayName === (user.displayName ?? user.name)) return { success: true };

  // 表示名(displayName)はXの表示名と同じく重複可。一意なハンドル(name、
  // /u/[name]のURLにも使う)はここでは変更しない。
  await prisma.user.update({ where: { id: user.id }, data: { displayName } });

  // フォロー中一覧・自分のProject一覧など、名前を参照する箇所は全ページに
  // またがるためlayout単位で無効化する。
  revalidatePath("/", "layout");
  return { success: true };
}

export type UpdateBioState = { error?: string; success?: boolean };

export async function updateBio(
  _prevState: UpdateBioState,
  formData: FormData,
): Promise<UpdateBioState> {
  const bio = String(formData.get("bio") ?? "").trim();
  if (bio.length > 160) return { error: "160文字以内で入力してください" };

  const user = await getOrCreateCurrentUser();
  await prisma.user.update({ where: { id: user.id }, data: { bio: bio || null } });

  // 自己紹介はプロフィールページでしか表示しないため、layout全体ではなく
  // そのページだけ無効化すればよい。
  revalidatePath(`/u/${encodeURIComponent(user.name)}`);
  return { success: true };
}

// トグルUIから直接呼ぶだけなのでuseActionStateは使わず、戻り値も持たない
// (revalidatePathで/settingsを再描画すればチェック状態は自然に反映される)。
export async function updateEmailNotificationsEnabled(enabled: boolean): Promise<void> {
  const user = await getOrCreateCurrentUser();
  await prisma.user.update({ where: { id: user.id }, data: { emailNotificationsEnabled: enabled } });
  revalidatePath("/settings");
}

export type UpdateAvatarState = { error?: string; success?: boolean };

// GitHubログイン済みUserは元々GitHubのアバターURLがimageに入っているが、
// アップロードした画像で上書きできるようにする(投稿画像と同じ保存経路)。
export async function updateAvatar(
  _prevState: UpdateAvatarState,
  formData: FormData,
): Promise<UpdateAvatarState> {
  const imageFile = extractImageFile(formData, "image");
  if (!imageFile) return { error: "画像を選択してください" };

  let imageUrl: string;
  try {
    imageUrl = await saveUploadedImage(imageFile);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "画像のアップロードに失敗しました" };
  }

  const user = await getOrCreateCurrentUser();
  await prisma.user.update({ where: { id: user.id }, data: { image: imageUrl } });

  // アバターはヘッダー・フィード・コメントなど全ページに現れるため、
  // layout単位で無効化する(表示名の変更と同じ考え方)。
  revalidatePath("/", "layout");
  return { success: true };
}
