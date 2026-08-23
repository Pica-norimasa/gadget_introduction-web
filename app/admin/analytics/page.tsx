import type { Metadata } from "next";
import { isAdminAuthed } from "@/app/lib/admin-auth";
import { getDailyVisitStats, getTopLandingPaths, getTrafficByReferrer } from "@/app/lib/cloudflare-analytics";
import { getClickEventCounts } from "@/app/lib/click-analytics";
import { getActivationStats, getDailyFunnelStats, getRetentionStats } from "@/app/lib/product-funnel";
import { AdminLoginForm } from "@/app/components/AdminLoginForm";
import { AdminLogoutButton } from "@/app/components/AdminLogoutButton";
import { AdminNav } from "@/app/components/AdminNav";

// 運営専用ページ(管理画面・ログイン・設定)は「新規ユーザーを連れてくる
// ページ」の分析対象外なので、流入ページランキングからは除外する。
const NON_CONTENT_PATH_PREFIXES = ["/admin", "/login", "/settings", "/api"];

const CLICK_EVENT_LABELS: Record<string, string> = {
  share_line: "SNS共有(LINE)",
  share_x: "SNS共有(X)",
  share_copy_link: "SNS共有(リンクコピー)",
  external_link_github: "外部リンク(GitHub)",
  external_link_appstore: "外部リンク(App Store)",
  external_link_googleplay: "外部リンク(Google Play)",
  external_link_preview: "リンクプレビューカードクリック",
  work_card_click: "作品カードクリック",
  profile_click: "作者プロフィールクリック",
  tool_badge_click: "ツールバッジクリック",
  platform_badge_click: "対応環境バッジクリック",
};

export const metadata: Metadata = { title: "アクセス状況 | Draftly Admin" };

function sum(values: number[]) {
  return values.reduce((total, v) => total + v, 0);
}

function formatSignedPercent(value: number | null) {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
}

type MergedRow = {
  date: string;
  uniques: number;
  pageViews: number;
  signups: number;
  posts: number;
  follows: number;
};

export default async function AdminAnalyticsPage() {
  const authed = await isAdminAuthed();
  if (!authed) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4">
        <AdminLoginForm />
      </div>
    );
  }

  let visits: Awaited<ReturnType<typeof getDailyVisitStats>> = [];
  let topPaths: Awaited<ReturnType<typeof getTopLandingPaths>> = [];
  let referrers: Awaited<ReturnType<typeof getTrafficByReferrer>> = [];
  let loadError: string | null = null;
  try {
    [visits, topPaths, referrers] = await Promise.all([
      getDailyVisitStats(30),
      getTopLandingPaths(30, 20),
      getTrafficByReferrer(30),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "取得に失敗しました";
  }
  const [funnel, activation, retention, clickEvents] = await Promise.all([
    getDailyFunnelStats(30),
    getActivationStats(),
    getRetentionStats(),
    getClickEventCounts(7),
  ]);
  const contentTopPaths = topPaths
    .filter((p) => !NON_CONTENT_PATH_PREFIXES.some((prefix) => p.path.startsWith(prefix)))
    .slice(0, 10);
  const totalReferrerViews = referrers.reduce((sum, r) => sum + r.pageViews, 0);

  const funnelByDate = new Map(funnel.map((f) => [f.date, f]));
  const merged: MergedRow[] = visits.map((v) => {
    const f = funnelByDate.get(v.date);
    return {
      date: v.date,
      uniques: v.uniques,
      pageViews: v.pageViews,
      signups: f?.signups ?? 0,
      posts: f?.posts ?? 0,
      follows: f?.follows ?? 0,
    };
  });

  const today = merged.at(-1);
  const last7 = merged.slice(-7);
  const prev7 = merged.slice(-14, -7);
  const last30 = merged;
  const last7Uniques = sum(last7.map((m) => m.uniques));
  const prev7Uniques = sum(prev7.map((m) => m.uniques));
  const last7PageViews = sum(last7.map((m) => m.pageViews));
  const last7Signups = sum(last7.map((m) => m.signups));
  const last7ConversionRate = last7Uniques > 0 ? (last7Signups / last7Uniques) * 100 : null;
  const avgPagesPerVisit = last7Uniques > 0 ? last7PageViews / last7Uniques : null;
  const visitorChangeRate =
    prev7Uniques > 0 ? ((last7Uniques - prev7Uniques) / prev7Uniques) * 100 : last7Uniques > 0 ? 100 : null;
  const topLandingPath = contentTopPaths[0];
  const topReferrer = referrers[0];
  const topClickEvent = clickEvents[0];
  const insightTone =
    last7Uniques < 100 ? "まだ母数が小さいので、率よりも流入ページ・クリックの増減を見た方が安全です。" :
    last7ConversionRate !== null && last7ConversionRate < 1
      ? "訪問は取れていますが、ログイン/投稿への転換が弱めです。投稿欄や初回導線の改善が効きそうです。"
      : "訪問から行動までの流れは悪くありません。次は流入元を増やす施策を試しやすい状態です。";

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
            アクセス状況
          </h1>
          <AdminLogoutButton />
        </div>

        <AdminNav active="analytics" />

        {loadError ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-6 text-[13px] text-[var(--ink-soft)]">
            <p className="mb-2 font-medium text-[var(--ink)]">Cloudflare Analyticsの設定が必要です</p>
            <p className="mb-2">
              CLOUDFLARE_WEB_ANALYTICS_TOKEN と CLOUDFLARE_ACCOUNT_ID の環境変数が未設定、または権限が不足しています。
            </p>
            <p className="text-[12px] text-[var(--ink-faint)]">エラー詳細: {loadError}</p>
          </div>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SummaryCard label="本日の訪問者(集計中)" value={today?.uniques ?? 0} />
              <SummaryCard label="過去7日間の訪問者" value={last7Uniques} />
              <SummaryCard label="過去7日間のサインアップ" value={last7Signups} />
              <SummaryCard
                label="訪問→サインアップ転換率"
                value={last7ConversionRate === null ? "—" : `${last7ConversionRate.toFixed(1)}%`}
              />
              <SummaryCard
                label="初回投稿率"
                value={activation.rate === null ? "—" : `${activation.rate.toFixed(1)}%`}
                sub={`${activation.activatedSignups}/${activation.totalSignups}人`}
              />
              <SummaryCard
                label="7日後再訪率"
                value={retention.rate === null ? "—" : `${retention.rate.toFixed(1)}%`}
                sub={`${retention.retainedSignups}/${retention.eligibleSignups}人`}
              />
              <SummaryCard
                label="1訪問あたりの閲覧ページ数"
                value={avgPagesPerVisit === null ? "—" : avgPagesPerVisit.toFixed(1)}
                sub="過去7日間"
              />
            </div>

            <div className="mb-6 grid gap-3 lg:grid-cols-3">
              <InsightCard
                title="今週の見え方"
                body={`訪問者は過去7日で${last7Uniques.toLocaleString("ja-JP")}人。前の7日比は${formatSignedPercent(visitorChangeRate)}です。${insightTone}`}
              />
              <InsightCard
                title="まず見る場所"
                body={
                  topLandingPath
                    ? `入口は「${topLandingPath.path}」が最多です。ここから作品カード・プロフィール・投稿へ進めているかをクリックイベントと合わせて見るのが良さそうです。`
                    : "流入ページのデータがまだ少ないため、まずはトップページと作品詳細への流入が記録されるかを見ます。"
                }
              />
              <InsightCard
                title="次の確認"
                body={
                  topClickEvent
                    ? `クリックは「${CLICK_EVENT_LABELS[topClickEvent.type] ?? topClickEvent.type}」が最多です。流入元は${topReferrer ? `「${topReferrer.bucket}」` : "まだ不明"}が目立っています。`
                    : "クリックイベントがまだ少ないため、作品カード・検索・共有ボタンのどこが押されるかを数日見ます。"
                }
              />
            </div>

            <p className="mb-6 text-[12px] text-[var(--ink-faint)]">
              ※ 訪問者数はCloudflare Web Analytics(JSビーコン型の実測値、ボット・クローラーはJSを実行しないため基本的にカウントされない)による日別集計。サインアップはGitHub/Xで実際にログインしたユーザーのみを数え、匿名ゲストやシードデータは含みません。
              初回投稿率はサインアップ済みユーザーのうち1件でも投稿した割合(全期間累積)、7日後再訪率はサインアップから7日以上経ったユーザーのうち7日後以降にも投稿・コメント・リアクション・フォローのいずれかをした割合(ログイン自体は記録していないため活動の有無で代用)。
            </p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div>
                <h2 className="mb-2 text-[13px] font-bold text-[var(--ink)]">流入の多いページ(過去30日)</h2>
                {contentTopPaths.length === 0 ? (
                  <p className="text-[12px] text-[var(--ink-faint)]">データがありません</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-[var(--line)] text-[12px] text-[var(--ink-faint)]">
                          <th className="px-3 py-2 font-medium">パス</th>
                          <th className="px-3 py-2 font-medium tabular-nums">閲覧数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contentTopPaths.map((p) => (
                          <tr key={p.path} className="border-b border-[var(--line)] last:border-0">
                            <td className="max-w-[220px] truncate px-3 py-2 font-mono text-[12px] text-[var(--ink)]" title={p.path}>
                              {p.path}
                            </td>
                            <td className="px-3 py-2 tabular-nums text-[var(--ink)]">
                              {p.pageViews.toLocaleString("ja-JP")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h2 className="mb-2 text-[13px] font-bold text-[var(--ink)]">流入元(過去30日)</h2>
                {referrers.length === 0 ? (
                  <p className="text-[12px] text-[var(--ink-faint)]">データがありません</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-[var(--line)] text-[12px] text-[var(--ink-faint)]">
                          <th className="px-3 py-2 font-medium">参照元</th>
                          <th className="px-3 py-2 font-medium tabular-nums">閲覧数</th>
                          <th className="px-3 py-2 font-medium tabular-nums">割合</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrers.map((r) => (
                          <tr key={r.bucket} className="border-b border-[var(--line)] last:border-0">
                            <td className="px-3 py-2 text-[var(--ink)]">{r.bucket}</td>
                            <td className="px-3 py-2 tabular-nums text-[var(--ink)]">
                              {r.pageViews.toLocaleString("ja-JP")}
                            </td>
                            <td className="px-3 py-2 tabular-nums text-[var(--ink-faint)]">
                              {totalReferrerViews > 0 ? `${((r.pageViews / totalReferrerViews) * 100).toFixed(0)}%` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-[var(--ink-faint)]">
                  ※ サイト内遷移は除外。GitHub/X/Google/LINEログインのリダイレクト由来のreferrerも混ざるため、厳密な流入元ではなく傾向として見てください。
                  Google Search Console(検索クエリ・表示回数・掲載順位)は未連携です。連携すると「どんな検索語で表示されているか」が分かるようになります。
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="mb-2 text-[13px] font-bold text-[var(--ink)]">クリックイベント(過去7日間)</h2>
              {clickEvents.length === 0 ? (
                <p className="text-[12px] text-[var(--ink-faint)]">データがありません</p>
              ) : (
                <div className="max-w-[420px] overflow-x-auto rounded-xl border border-[var(--line)]">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[12px] text-[var(--ink-faint)]">
                        <th className="px-3 py-2 font-medium">種別</th>
                        <th className="px-3 py-2 font-medium tabular-nums">件数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clickEvents.map((e) => (
                        <tr key={e.type} className="border-b border-[var(--line)] last:border-0">
                          <td className="px-3 py-2 text-[var(--ink)]">{CLICK_EVENT_LABELS[e.type] ?? e.type}</td>
                          <td className="px-3 py-2 tabular-nums text-[var(--ink)]">
                            {e.count.toLocaleString("ja-JP")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-2 text-[11px] text-[var(--ink-faint)]">
                ※ 作品カード・作者プロフィール・ツール/対応環境バッジ・SNS共有・外部リンク(GitHub/App
                Store/Google Play)のクリックを計測中。「作品カードクリック」はpath(どのページで押されたか)と
                合わせて見ると、関連作品タブ・ランキング・ホームフィード等どこからの流入が効いているか分かります。
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[12px] text-[var(--ink-faint)]">
                    <th className="px-4 py-2 font-medium">日付</th>
                    <th className="px-4 py-2 font-medium tabular-nums">訪問者</th>
                    <th className="px-4 py-2 font-medium tabular-nums">サインアップ</th>
                    <th className="px-4 py-2 font-medium tabular-nums">投稿</th>
                    <th className="px-4 py-2 font-medium tabular-nums">フォロー</th>
                  </tr>
                </thead>
                <tbody>
                  {[...last30].reverse().map((row) => (
                    <tr key={row.date} className="border-b border-[var(--line)] last:border-0">
                      <td className="px-4 py-2 text-[var(--ink)]">{row.date}</td>
                      <td className="px-4 py-2 tabular-nums text-[var(--ink)]">
                        {row.uniques.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-2 tabular-nums text-[var(--ink)]">
                        {row.signups.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-2 tabular-nums text-[var(--ink-faint)]">
                        {row.posts.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-2 tabular-nums text-[var(--ink-faint)]">
                        {row.follows.toLocaleString("ja-JP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <p className="mb-1 text-[12px] text-[var(--ink-faint)]">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums text-[var(--ink)]">
        {typeof value === "number" ? value.toLocaleString("ja-JP") : value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] tabular-nums text-[var(--ink-faint)]">{sub}</p>}
    </div>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <p className="mb-2 text-[12px] font-semibold text-[var(--accent)]">{title}</p>
      <p className="text-[12.5px] leading-6 text-[var(--ink-soft)]">{body}</p>
    </div>
  );
}
