"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

export type UpdateNameState = { error?: string; success?: boolean };

export async function updateDisplayName(
  _prevState: UpdateNameState,
  formData: FormData,
): Promise<UpdateNameState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "名前を入力してください" };
  if (name.length > 20) return { error: "20文字以内で入力してください" };

  const user = await getOrCreateCurrentUser();
  if (name === user.name) return { success: true };

  try {
    await prisma.user.update({ where: { id: user.id }, data: { name } });
  } catch {
    return { error: "その名前は既に使われています" };
  }

  // フォロー中一覧・自分のProject一覧など、名前を参照する箇所は全ページに
  // またがるためlayout単位で無効化する。
  revalidatePath("/", "layout");
  return { success: true };
}
