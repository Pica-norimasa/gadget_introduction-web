"use server";

import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

// 通知ドロワーを開いた時に呼ばれる。未読を全部既読にするだけ。
export async function markNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.notification.updateMany({
    where: { recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
