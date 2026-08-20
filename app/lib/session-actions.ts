"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { auth, signOut } from "@/auth";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { extractImageFile, saveUploadedImage } from "@/app/lib/upload";
import { sendVerificationEmail, SITE_URL } from "@/app/lib/email";
import { prisma } from "@/app/lib/prisma";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// 確認メールの送信自体はフォーム送信をブロックしたくないのでafter()の
// 中で行い、失敗してもメールアドレスの保存自体は成功したままにする。
async function sendVerification(email: string): Promise<void> {
  const token = randomUUID();
  try {
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS) },
    });
    await sendVerificationEmail({
      to: email,
      verifyUrl: `${SITE_URL}/verify-email?token=${token}`,
    });
  } catch (e) {
    console.error("確認メールの送信に失敗しました", e);
  }
}

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

export type UpdateEmailState = { error?: string; success?: boolean };

// Xログインはメールアドレスを返さない(users.readスコープの範囲外)ため、
// GitHub連携もしていないユーザーは通知の送り先が無い。ここで手動入力
// できるようにする。他人のアドレスを勝手に登録されると通知メールが
// その人に届いてしまうため、確認リンクを踏むまでemailVerifiedはnullの
// ままにし、notifyByEmail(comment-actions.ts)側で送信をブロックする。
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateEmail(_prevState: UpdateEmailState, formData: FormData): Promise<UpdateEmailState> {
  const email = String(formData.get("email") ?? "").trim();
  if (email && !EMAIL_PATTERN.test(email)) return { error: "メールアドレスの形式が正しくありません" };

  const user = await getOrCreateCurrentUser();
  if (email === user.email) return { success: true };

  try {
    await prisma.user.update({ where: { id: user.id }, data: { email: email || null, emailVerified: null } });
  } catch {
    return { error: "このメールアドレスは既に別のアカウントで使われています" };
  }

  if (email) after(() => sendVerification(email));

  revalidatePath("/settings");
  return { success: true };
}

export async function resendVerificationEmail(): Promise<void> {
  const user = await getOrCreateCurrentUser();
  if (!user.email || user.emailVerified) return;
  await sendVerification(user.email);
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

export type DeleteAccountState = { error?: string };

// 退会。投稿・コメント本文は他人のスレッドの文脈を壊さないよう残すが、
// 個人を特定する情報(name/email/画像/連携ユーザー名等)は消して
// 「削除されたユーザー」に置き換える(Xの凍結/削除済みアカウント表示と
// 同じ考え方)。Account行も削除し、同じGitHub/X/Googleアカウントで
// 再ログインしてもこの行には戻れないようにする(再ログインは新規Userに
// なる)。匿名ゲスト(sessionIdのみ)には「退会」という概念が無いため、
// 実ログイン(auth()のセッション)を必須にする。
export async function deleteAccount(_prevState: DeleteAccountState, _formData: FormData): Promise<DeleteAccountState> {
  const session = await auth();
  if (!session?.user) return { error: "ログインが必要です" };

  const userId = session.user.id;

  await prisma.$transaction([
    prisma.account.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        name: `deleted-${userId}`,
        displayName: "削除されたユーザー",
        bio: null,
        image: null,
        email: null,
        emailVerified: null,
        emailNotificationsEnabled: false,
        githubUsername: null,
        xUsername: null,
        sessionId: null,
        deletedAt: new Date(),
      },
    }),
  ]);

  await signOut({ redirect: false });
  redirect("/");
}
