"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

// トグル: 既にミュートしていれば取り消し、していなければMute行を作る。
// FollowButtonと同じ、認証無しの軽量セッションUser名義。
export async function toggleMute(mutedId: string) {
  const user = await getOrCreateCurrentUser();
  if (mutedId === user.id) return;

  const existing = await prisma.mute.findUnique({
    where: { muterId_mutedId: { muterId: user.id, mutedId } },
  });

  if (existing) {
    await prisma.mute.delete({ where: { id: existing.id } });
  } else {
    await prisma.mute.create({ data: { muterId: user.id, mutedId } });
  }

  // フィード・検索・コメント欄など、ミュート状態を参照する箇所は全ページに
  // またがるためlayout単位で無効化する。
  revalidatePath("/", "layout");
}
