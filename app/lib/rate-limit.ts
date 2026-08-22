// 荒らし・スパム対策の簡易レート制限。Redis等は使わず、既存のDBの
// createdAt列を数えるだけの軽量な実装(このアプリの規模ではこれで十分)。
export function rateLimitWindowStart(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

// 「直近N分にX件」の判定。counterには呼び出し側でモデルごとの
// prisma.X.count({ where: { authorId, createdAt: { gte: since } } })を
// 渡す(モデルをまたぐ共通化はテーブル差異を吸収する手間の割に旨味が
// 薄いため、count自体は呼び出し側に残し、窓の計算+閾値判定だけを
// ここに集約した)。
export async function isRateLimited(
  counter: (since: Date) => Promise<number>,
  windowMinutes: number,
  threshold: number,
): Promise<boolean> {
  const count = await counter(rateLimitWindowStart(windowMinutes));
  return count >= threshold;
}
