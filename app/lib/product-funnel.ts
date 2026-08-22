import { prisma } from "@/app/lib/prisma";

export type DailyFunnelStat = {
  date: string;
  signups: number;
  posts: number;
  follows: number;
};

type CountRow = { date: string; count: bigint };

function toMap(rows: CountRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = typeof row.date === "string" ? row.date.slice(0, 10) : String(row.date).slice(0, 10);
    map.set(key, Number(row.count));
  }
  return map;
}

// アクセス数(Cloudflare)と同じ日付キーで突き合わせられるよう、UTC日付で
// 集計する。emailがnullのUserは匿名ゲスト or シードデータなので、実際に
// GitHub/Xでログインしたユーザーだけを「サインアップ」として数える
// (session.tsのgetOrCreateCurrentUser参照)。
export async function getDailyFunnelStats(days: number): Promise<DailyFunnelStat[]> {
  const until = new Date();
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - days);

  const [signupRows, postRows, followRows] = await Promise.all([
    prisma.$queryRaw<CountRow[]>`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM User
      WHERE email IS NOT NULL AND createdAt >= ${since} AND createdAt < ${until}
      GROUP BY DATE(createdAt)
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM Post
      WHERE createdAt >= ${since} AND createdAt < ${until}
      GROUP BY DATE(createdAt)
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM Follow
      WHERE createdAt >= ${since} AND createdAt < ${until}
      GROUP BY DATE(createdAt)
    `,
  ]);

  const signups = toMap(signupRows);
  const posts = toMap(postRows);
  const follows = toMap(followRows);

  const result: DailyFunnelStat[] = [];
  for (let d = new Date(since); d < until; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    result.push({
      date: key,
      signups: signups.get(key) ?? 0,
      posts: posts.get(key) ?? 0,
      follows: follows.get(key) ?? 0,
    });
  }
  return result;
}

export type ActivationStats = { totalSignups: number; activatedSignups: number; rate: number | null };

// 「初回投稿率」= サインアップ済み(email非null)ユーザーのうち、1件でも
// Postを投稿したことがある割合。CEOレンズで見た活性化(Activation)の
// 代理指標。日別コホートにすると母数が小さすぎてノイズだらけになるため、
// 全期間の累積で見る。
export async function getActivationStats(): Promise<ActivationStats> {
  const rows = await prisma.$queryRaw<{ total: bigint; activated: bigint }[]>`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN EXISTS (SELECT 1 FROM Post WHERE Post.authorId = User.id) THEN 1 ELSE 0 END) as activated
    FROM User
    WHERE email IS NOT NULL
  `;
  const total = Number(rows[0]?.total ?? 0);
  const activated = Number(rows[0]?.activated ?? 0);
  return { totalSignups: total, activatedSignups: activated, rate: total > 0 ? (activated / total) * 100 : null };
}

export type RetentionStats = { eligibleSignups: number; retainedSignups: number; rate: number | null };

// 「7日後再訪率」= サインアップから7日以上経過したユーザーのうち、
// サインアップの7日後以降にも何らかの活動(投稿・コメント・リアクション・
// フォロー)をした割合。ログイン自体を記録するテーブルが無いため、
// 「戻ってきて何かした」ことの代理指標として使う。
export async function getRetentionStats(): Promise<RetentionStats> {
  const rows = await prisma.$queryRaw<{ eligible: bigint; retained: bigint }[]>`
    SELECT
      COUNT(*) as eligible,
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM Post WHERE Post.authorId = User.id AND Post.createdAt >= DATE_ADD(User.createdAt, INTERVAL 7 DAY)
        UNION ALL
        SELECT 1 FROM Comment WHERE Comment.authorId = User.id AND Comment.createdAt >= DATE_ADD(User.createdAt, INTERVAL 7 DAY)
        UNION ALL
        SELECT 1 FROM Reaction WHERE Reaction.userId = User.id AND Reaction.createdAt >= DATE_ADD(User.createdAt, INTERVAL 7 DAY)
        UNION ALL
        SELECT 1 FROM Follow WHERE Follow.followerId = User.id AND Follow.createdAt >= DATE_ADD(User.createdAt, INTERVAL 7 DAY)
      ) THEN 1 ELSE 0 END) as retained
    FROM User
    WHERE email IS NOT NULL AND createdAt <= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `;
  const eligible = Number(rows[0]?.eligible ?? 0);
  const retained = Number(rows[0]?.retained ?? 0);
  return { eligibleSignups: eligible, retainedSignups: retained, rate: eligible > 0 ? (retained / eligible) * 100 : null };
}
