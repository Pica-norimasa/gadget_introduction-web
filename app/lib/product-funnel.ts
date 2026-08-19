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
