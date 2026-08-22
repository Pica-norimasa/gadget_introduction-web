import { prisma } from "@/app/lib/prisma";

// 退会/管理画面からの論理削除で共有するコア処理。投稿・コメント本文は
// 他人のスレッドの文脈を壊さないよう残すが、個人を特定する情報
// (name/email/画像/連携ユーザー名等)は消して「削除されたユーザー」に
// 置き換える(Xの凍結/削除済みアカウント表示と同じ考え方)。Account行も
// 削除し、同じGitHub/X/Googleアカウントで再ログインしてもこの行には
// 戻れないようにする(再ログインは新規Userになる)。
export async function anonymizeUser(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.account.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        name: `deleted-${userId}`,
        displayName: "削除されたユーザー",
        bio: null,
        image: null,
        email: null,
        emailVerified: null,
        emailNotificationsEnabled: false,
        githubUsername: null,
        xUsername: null,
        sessionId: null,
        deletedAt: new Date(),
      },
    }),
  ]);
}
