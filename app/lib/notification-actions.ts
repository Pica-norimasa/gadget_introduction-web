"use server";

import { getCurrentUser } from "@/app/lib/session";
import { getNotificationData } from "@/app/lib/queries";
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

// NotificationBell.tsxがポーリング(setInterval)から呼ぶための薄いラッパー。
// queries.tsは"use server"を持たないためクライアント側から直接importできず、
// このファイル経由でServer Actionとして公開する。
export async function fetchNotificationData() {
  return getNotificationData();
}
