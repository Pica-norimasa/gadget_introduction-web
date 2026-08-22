import { prisma } from "@/app/lib/prisma";

// ゲストとして投稿・コメント・リアクション等をした後にGitHub/X/Google
// でログインすると、ゲスト時代のUser行とログイン後のUser行が別人に
// なってしまう(session.tsのgetCurrentUser()コメント参照)。ログイン
// 成功のたびに(auth.tsのsignInコールバックから)呼び、その時点で
// ブラウザのセッションCookieが指しているゲストUser行の持ち物を
// ログイン後のUser行へ一括で付け替えてから、空になった旧ゲスト行を消す。
//
// Reaction/Repost/Follow/Mute/Blockは(target, user)の組み合わせに
// 一意制約があるため、ログイン後のアカウントに既に同じ組み合わせが
// あると付け替えられない(重複)。その場合はゲスト側の行を捨てる
// (実質的に同じ内容の重複なので実害は無い)。対象は基本的に少数
// (ゲストの投稿・コメントは3件までの制限があり、リアクション等も
// 一人のブラウザ利用の範囲でしかない)ため、1件ずつの処理で十分。
export async function mergeGuestIntoUser(guestId: string, targetUserId: string): Promise<void> {
  if (guestId === targetUserId) return;

  // 一意制約が絡まない、単純な付け替え。
  await prisma.project.updateMany({ where: { authorId: guestId }, data: { authorId: targetUserId } });
  await prisma.post.updateMany({ where: { authorId: guestId }, data: { authorId: targetUserId } });
  await prisma.comment.updateMany({ where: { authorId: guestId }, data: { authorId: targetUserId } });
  await prisma.notification.updateMany({ where: { recipientId: guestId }, data: { recipientId: targetUserId } });
  await prisma.notification.updateMany({ where: { actorId: guestId }, data: { actorId: targetUserId } });
  await prisma.report.updateMany({ where: { reporterId: guestId }, data: { reporterId: targetUserId } });
  await prisma.report.updateMany({ where: { reportedUserId: guestId }, data: { reportedUserId: targetUserId } });

  await mergeUniquePairRows(prisma.reaction, { userId: guestId }, { userId: targetUserId });
  await mergeUniquePairRows(prisma.repost, { userId: guestId }, { userId: targetUserId });
  await mergeUniquePairRows(prisma.follow, { followerId: guestId }, { followerId: targetUserId }, "followingId");
  await mergeUniquePairRows(prisma.follow, { followingId: guestId }, { followingId: targetUserId }, "followerId");
  await mergeUniquePairRows(prisma.mute, { muterId: guestId }, { muterId: targetUserId }, "mutedId");
  await mergeUniquePairRows(prisma.mute, { mutedId: guestId }, { mutedId: targetUserId }, "muterId");
  await mergeUniquePairRows(prisma.block, { blockerId: guestId }, { blockerId: targetUserId }, "blockedId");
  await mergeUniquePairRows(prisma.block, { blockedId: guestId }, { blockedId: targetUserId }, "blockerId");

  // Account/Session行はゲストには存在しないため、User行を消すだけでよい。
  await prisma.user.delete({ where: { id: guestId } }).catch(() => {});
}

// findMany/update/deleteの3メソッドだけに依存した最小限の型(Prismaの
// モデルデリゲートはモデルごとに戻り値の形が違うため、genericに絞る)。
type UniquePairDelegate = {
  findMany: (args: { where: Record<string, unknown> }) => Promise<Array<{ id: string } & Record<string, unknown>>>;
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
};

// (guestId, 相手)の組み合わせで一意制約があるテーブル向け。ログイン後の
// アカウントに同じ(targetId, 相手)が既にあれば重複するので、その行は
// 捨てる。counterpartField(followingId/mutedId/blockedId等)が
// targetUserId自身と一致する場合(=自分自身を対象にしてしまう)も同様に捨てる。
async function mergeUniquePairRows(
  delegate: UniquePairDelegate,
  guestWhere: Record<string, string>,
  targetData: Record<string, string>,
  counterpartField?: string,
): Promise<void> {
  const rows = await delegate.findMany({ where: guestWhere });
  const targetUserId = Object.values(targetData)[0];
  for (const row of rows) {
    if (counterpartField && row[counterpartField] === targetUserId) {
      await delegate.delete({ where: { id: row.id } }).catch(() => {});
      continue;
    }
    try {
      await delegate.update({ where: { id: row.id }, data: targetData });
    } catch {
      // 一意制約違反(既に同じ組み合わせがログイン後のアカウント側にある)。
      await delegate.delete({ where: { id: row.id } }).catch(() => {});
    }
  }
}
