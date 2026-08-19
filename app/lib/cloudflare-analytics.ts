// Cloudflareの無料プランでも使えるZone Analytics(GraphQL)から、日別のユニーク
// 訪問者数を取ってくるだけの薄いクライアント。自前でDBに書き込む方式だと
// 全アクセスでRDSへの書き込みが発生してしまうため、既にオレンジクラウドで
// 全トラフィックを受けているCloudflare側の集計をそのまま使う。
const CLOUDFLARE_GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

export type DailyVisitStat = {
  date: string;
  uniques: number;
  requests: number;
  pageViews: number;
};

type GraphQLResponse = {
  data?: {
    viewer?: {
      zones?: {
        httpRequests1dGroups?: {
          dimensions: { date: string };
          uniq: { uniques: number };
          sum: { requests: number; pageViews: number };
        }[];
      }[];
    };
  };
  errors?: { message: string }[];
};

// dateフィールドは "2026-08-19" 形式で比較する。sinceは含む・untilは含まない
// 前提でCloudflare側が扱うため、呼び出し側は今日+1日をuntilに渡す。
export async function getDailyVisitStats(days: number): Promise<DailyVisitStat[]> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneTag = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneTag) {
    throw new Error("CLOUDFLARE_API_TOKEN または CLOUDFLARE_ZONE_ID が設定されていません");
  }

  const until = new Date();
  const since = new Date(until);
  since.setDate(since.getDate() - days);
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

  const query = `
    query GetDailyVisits($zoneTag: String!, $since: Date!, $until: Date!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(
            limit: 90
            filter: { date_geq: $since, date_leq: $until }
            orderBy: [date_ASC]
          ) {
            dimensions { date }
            uniq { uniques }
            sum { requests, pageViews }
          }
        }
      }
    }
  `;

  const res = await fetch(CLOUDFLARE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { zoneTag, since: toDateStr(since), until: toDateStr(until) },
    }),
    cache: "no-store",
  });

  const json: GraphQLResponse = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  const groups = json.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? [];
  return groups.map((g) => ({
    date: g.dimensions.date,
    uniques: g.uniq.uniques,
    requests: g.sum.requests,
    pageViews: g.sum.pageViews,
  }));
}
