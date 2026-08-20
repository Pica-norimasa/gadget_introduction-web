// CloudflareのWeb Analytics(RUM、JSビーコン型)から、日別の訪問者数を
// 取ってくるだけの薄いクライアント。以前はZone Analytics(生のHTTP
// リクエスト集計、ボット・クローラーも素通しでカウントされる)を使って
// いたが、実際の人間の訪問者数とかなり乖離があった(Zone Analyticsで
// 146訪問/日だった同じ日に、Web Analyticsでは24時間で52訪問)ため、
// ボットがJSを実行しない限り記録されないWeb Analytics側に切り替えた。
// Web Analytics(RUM)はアカウント単位のリソースなので、Zone Analytics
// (CLOUDFLARE_API_TOKEN/CLOUDFLARE_ZONE_ID)とは別のトークン
// (CLOUDFLARE_WEB_ANALYTICS_TOKEN、Account.Account Analytics:Read権限)
// とアカウントID(CLOUDFLARE_ACCOUNT_ID)を使う。
const CLOUDFLARE_GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

// このアカウント配下に複数サイトが増えても、draftly-web.dev以外の
// 数値を混ぜないようにホスト名で絞り込む。
const SITE_HOST = "draftly-web.dev";

export type DailyVisitStat = {
  date: string;
  uniques: number;
  pageViews: number;
};

type GraphQLResponse = {
  data?: {
    viewer?: {
      accounts?: {
        rumPageloadEventsAdaptiveGroups?: {
          dimensions: { date: string };
          count: number;
          sum: { visits: number };
        }[];
      }[];
    };
  };
  errors?: { message: string }[];
};

// dateフィールドは "2026-08-19" 形式で比較する。sinceは含む・untilは含まない
// 前提でCloudflare側が扱うため、呼び出し側は今日+1日をuntilに渡す。
export async function getDailyVisitStats(days: number): Promise<DailyVisitStat[]> {
  const token = process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN;
  const accountTag = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountTag) {
    throw new Error("CLOUDFLARE_WEB_ANALYTICS_TOKEN または CLOUDFLARE_ACCOUNT_ID が設定されていません");
  }

  const until = new Date();
  const since = new Date(until);
  since.setDate(since.getDate() - days);
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

  const query = `
    query GetDailyVisits($accountTag: String!, $since: Date!, $until: Date!, $host: string!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            limit: 90
            filter: { date_geq: $since, date_leq: $until, requestHost: $host }
            orderBy: [date_ASC]
          ) {
            dimensions { date }
            count
            sum { visits }
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
      variables: { accountTag, since: toDateStr(since), until: toDateStr(until), host: SITE_HOST },
    }),
    cache: "no-store",
  });

  const json: GraphQLResponse = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  const groups = json.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
  return groups.map((g) => ({
    date: g.dimensions.date,
    uniques: g.sum.visits,
    pageViews: g.count,
  }));
}
