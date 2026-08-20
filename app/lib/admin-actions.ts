"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE } from "@/app/lib/admin-cookie";
import { isAdminAuthed } from "@/app/lib/admin-auth";
import { anonymizeUser } from "@/app/lib/user-admin";
import { prisma } from "@/app/lib/prisma";

export type AdminLoginState = { error?: string };

export async function adminLogin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const key = String(formData.get("key") ?? "");
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) return { error: "ADMIN_KEYが設定されていません(.envを確認してください)" };
  if (key !== adminKey) return { error: "合言葉が違います" };

  (await cookies()).set(ADMIN_COOKIE, adminKey, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  revalidatePath("/admin/reports");
  return {};
}

export async function adminLogout(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
  revalidatePath("/admin/reports");
}

// 対応済み⇔未対応をトグルする。isAdminAuthed()はCookie経由なので、この
// Server Action自体もページと同じゲートで守る(未ログインなら何もしない)。
export async function toggleReportResolved(reportId: string): Promise<void> {
  if (!(await isAdminAuthed())) return;

  const report = await prisma.report.findUnique({ where: { id: reportId }, select: { resolvedAt: true } });
  if (!report) return;

  await prisma.report.update({
    where: { id: reportId },
    data: { resolvedAt: report.resolvedAt ? null : new Date() },
  });

  revalidatePath("/admin/reports");
}

export type AdminDeleteUserState = { error?: string };

// ユーザー一覧(/admin/users)からの論理削除。中身はdeleteAccount
// (session-actions.ts、本人による退会)と同じanonymizeUser()を使う。
// 既に削除済みのユーザーへの二重実行を弾く(idempotentにするため)。
export async function adminDeleteUser(
  _prevState: AdminDeleteUserState,
  formData: FormData,
): Promise<AdminDeleteUserState> {
  if (!(await isAdminAuthed())) return { error: "権限がありません" };

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "ユーザーが指定されていません" };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { deletedAt: true } });
  if (!user) return { error: "ユーザーが見つかりません" };
  if (user.deletedAt) return { error: "既に削除済みです" };

  await anonymizeUser(userId);

  revalidatePath("/admin/users");
  return {};
}
