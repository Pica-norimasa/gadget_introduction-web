"use server";

import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

export type ClickEventType =
  | "share_line"
  | "share_x"
  | "share_copy_link"
  | "external_link_github"
  | "external_link_appstore"
  | "external_link_googleplay"
  | "work_card_click"
  | "profile_click"
  | "tool_badge_click"
  | "platform_badge_click";

// SNS共有・外部リンククリックの計測。他のServer Actionと違いrevalidatePathは
// 呼ばない(表示に影響しない裏方の記録のため)。計測のためだけに匿名訪問者の
// ゲストUser行を新規作成したくないので、getOrCreateCurrentUser()ではなく
// 読み取り専用のgetCurrentUser()を使う(既存ユーザーなら紐付け、未ログイン
// ならuserId nullのまま記録)。計測失敗でクリック自体の動作(リンク遷移等)を
// 壊さないよう、エラーは握りつぶす。
export async function trackClick(type: ClickEventType, path: string, target?: string): Promise<void> {
  try {
    const user = await getCurrentUser();
    await prisma.analyticsEvent.create({
      data: { type, path, target, userId: user?.id },
    });
  } catch {
    // 計測はベストエフォート。失敗してもユーザー操作は継続させる。
  }
}
