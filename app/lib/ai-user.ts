import { AI_BOT_NAME } from "@/app/lib/ai-bot-name";
import { prisma } from "@/app/lib/prisma";

// 応援コメント機能の投稿者として使う固定User。名前がuniqueなことを利用して
// upsertし、初回呼び出し時に一度だけ作られる(セッションを持たない=
// mock-data由来のシードUserと同じ扱い)。
export function getAiUser() {
  return prisma.user.upsert({
    where: { name: AI_BOT_NAME },
    update: {},
    create: { name: AI_BOT_NAME },
  });
}
