import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { SESSION_COOKIE } from "@/app/lib/session-cookie";

function randomGuestName(sessionId: string): string {
  return `ゲスト${sessionId.replace(/-/g, "").slice(0, 4)}`;
}

// 表示専用。GitHubでログイン済みならそのUserを返す(優先)。未ログインで、
// まだ一度も投稿・リアクション・フォローをしていない訪問者はUser行が
// まだ無いのでnullを返す(呼び出し側は「未名乗り」として扱う)。
//
// ログイン・匿名ゲストの共存について: GitHubログインを追加した今も、
// 未ログインの匿名ゲスト(セッションCookieだけのUser)は従来通り使える
// ままにしている(投稿・コメント等の書き込み系アクションを全部
// ログイン必須にする大きな変更は別途スコープとして切り出す判断)。
// ただし、匿名ゲストとして先に使ってからGitHubでログインした場合、
// ゲスト時代のUser行とログイン後のUser行は別人扱いになり、投稿等は
// 引き継がれない(アカウント統合は今回のスコープ外)。
export async function getCurrentUser() {
  const session = await auth();
  if (session?.user?.id) {
    return prisma.user.findUnique({ where: { id: session.user.id } });
  }

  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return prisma.user.findUnique({ where: { sessionId } });
}

// 投稿・リアクション・フォローなど、書き込み系Server Action専用。
// GitHubでログイン済みならそのUserをそのまま返す(作成はAuth.jsの
// PrismaAdapterが初回サインイン時に既に行っている)。未ログインの場合は
// 従来通り、初回アクション時にゲスト名(ゲストXXXX)でUser行を遅延生成する。
export async function getOrCreateCurrentUser() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user) return user;
    // JWTが指すUserが何らかの理由で存在しない(削除された等)場合は、
    // ログインしていない扱いとして下の匿名ゲスト経路にフォールバックする。
  }

  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    throw new Error("セッションCookieが見つかりません(proxy.tsが動作していない可能性があります)");
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
