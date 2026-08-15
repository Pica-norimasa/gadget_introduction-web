import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { SESSION_COOKIE } from "@/app/lib/session-cookie";

function randomGuestName(sessionId: string): string {
  return `ゲスト${sessionId.replace(/-/g, "").slice(0, 4)}`;
}

// 表示専用。まだ一度も投稿・リアクション・フォローをしていない訪問者は
// User行がまだ無いのでnullを返す(呼び出し側は「未名乗り」として扱う)。
export async function getCurrentUser() {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return prisma.user.findUnique({ where: { sessionId } });
}

// 投稿・リアクション・フォローなど、書き込み系Server Action専用。
// 初回アクション時にゲスト名(ゲストXXXX)でUser行を遅延生成する。
export async function getOrCreateCurrentUser() {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    throw new Error("セッションCookieが見つかりません(middleware.tsが動作していない可能性があります)");
  }

  const existing = await prisma.user.findUnique({ where: { sessionId } });
  if (existing) return existing;

  try {
    return await prisma.user.create({
      data: { sessionId, name: randomGuestName(sessionId) },
    });
  } catch {
    // 同時リクエストによるsessionId競合(既に作られていた)か、
    // 極めて低確率のname衝突。前者ならそれを返し、後者ならsuffixを付けて再作成する。
    const raceWinner = await prisma.user.findUnique({ where: { sessionId } });
    if (raceWinner) return raceWinner;
    return prisma.user.create({
      data: { sessionId, name: `${randomGuestName(sessionId)}-${Date.now().toString(36).slice(-4)}` },
    });
  }
}
