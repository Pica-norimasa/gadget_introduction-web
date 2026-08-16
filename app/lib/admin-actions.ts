"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE } from "@/app/lib/admin-cookie";

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
