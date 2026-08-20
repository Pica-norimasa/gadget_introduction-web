"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE } from "@/app/lib/admin-cookie";
import { isAdminAuthed } from "@/app/lib/admin-auth";
import { anonymizeUser } from "@/app/lib/user-admin";
import { isRateLimited } from "@/app/lib/rate-limit";
import { prisma } from "@/app/lib/prisma";

export type AdminLoginState = { error?: string };

// 総当たり対策(直近10分に5回失敗したらロック)。個人を識別しない
// 共有の合言葉なのでIPは見ず、失敗件数の合計だけで判定する
// (ADMIN_KEYを知らない攻撃者が無制限に試行できるのを防ぐのが目的で、
// 本人が誤入力を重ねた場合も同様にロックされるのは許容する)。
async function isAdminLoginLocked(): Promise<boolean> {
  return isRateLimited((since) => prisma.adminLoginAttempt.count({ where: { createdAt: { gte: since } } }), 10, 5);
}

export async function adminLogin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const key = String(formData.get("key") ?? "");
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) return { error: "ADMIN_KEYが設定されていません(.envを確認してください)" };

  if (await isAdminLoginLocked()) {
    return { error: "試行回数が多すぎます。しばらくしてから試してください" };
  }

  if (key !== adminKey) {
    await prisma.adminLoginAttempt.create({ data: {} });
    return { error: "合言葉が違います" };
  }

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

// ユーザー一覧(/admin/users)・通報一覧(/admin/reports、対象がユーザーの
// 場合)の両方から呼ばれる。中身はdeleteAccount(session-actions.ts、
// 本人による退会)と同じanonymizeUser()を使う。既に削除済みのユーザーへの
// 二重実行を弾く(idempotentにするため)。
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
  revalidatePath("/admin/reports");

  revalidatePath("/admin/users");
  return {};
}
