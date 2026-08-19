import type { Metadata } from "next";
import Link from "next/link";
import { isAdminAuthed } from "@/app/lib/admin-auth";
import { getDailyVisitStats } from "@/app/lib/cloudflare-analytics";
import { getDailyFunnelStats } from "@/app/lib/product-funnel";
import { AdminLoginForm } from "@/app/components/AdminLoginForm";
import { AdminLogoutButton } from "@/app/components/AdminLogoutButton";

export const metadata: Metadata = { title: "アクセス状況 | Draftly Admin" };

function sum(values: number[]) {
  return values.reduce((total, v) => total + v, 0);
}

type MergedRow = {
  date: string;
  uniques: number;
  requests: number;
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
  let loadError: string | null = null;
  try {
    visits = await getDailyVisitStats(30);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "取得に失敗しました";
  }
  const funnel = await getDailyFunnelStats(30);

  const funnelByDate = new Map(funnel.map((f) => [f.date, f]));
  const merged: MergedRow[] = visits.map((v) => {
    const f = funnelByDate.get(v.date);
    return {
      date: v.date,
      uniques: v.uniques,
      requests: v.requests,
      signups: f?.signups ?? 0,
      posts: f?.posts ?? 0,
      follows: f?.follows ?? 0,
    };
  });

  const today = merged.at(-1);
  const last7 = merged.slice(-7);
  const last30 = merged;
  const last7Uniques = sum(last7.map((m) => m.uniques));
  const last7Signups = sum(last7.map((m) => m.signups));
  const last7ConversionRate = last7Uniques > 0 ? (last7Signups / last7Uniques) * 100 : null;

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
            アクセス状況
          </h1>
          <AdminLogoutButton />
        </div>

        <div className="mb-6 flex items-center gap-1 border-b border-[var(--line)]">
          <Link href="/admin/analytics" className="relative px-3 py-2 text-sm font-medium text-[var(--ink)]">
            アクセス状況
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />
          </Link>
          <Link
            href="/admin/reports"
            className="px-3 py-2 text-sm font-medium text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          >
            通報一覧
          </Link>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-6 text-[13px] text-[var(--ink-soft)]">
            <p className="mb-2 font-medium text-[var(--ink)]">Cloudflare Analyticsの設定が必要です</p>
            <p className="mb-2">
              CLOUDFLARE_API_TOKEN と CLOUDFLARE_ZONE_ID の環境変数が未設定、または権限が不足しています。
            </p>
            <p className="text-[12px] text-[var(--ink-faint)]">エラー詳細: {loadError}</p>
          </div>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard label="本日の訪問者(集計中)" value={today?.uniques ?? 0} />
              <SummaryCard label="過去7日間の訪問者" value={last7Uniques} />
              <SummaryCard label="過去7日間のサインアップ" value={last7Signups} />
              <SummaryCard
                label="訪問→サインアップ転換率"
                value={last7ConversionRate === null ? "—" : `${last7ConversionRate.toFixed(1)}%`}
              />
            </div>

            <p className="mb-6 text-[12px] text-[var(--ink-faint)]">
              ※ 訪問者数はCloudflareの日別集計による概算値。サインアップはGitHub/Xで実際にログインしたユーザーのみを数え、匿名ゲストやシードデータは含みません。
            </p>

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

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <p className="mb-1 text-[12px] text-[var(--ink-faint)]">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums text-[var(--ink)]">
        {typeof value === "number" ? value.toLocaleString("ja-JP") : value}
      </p>
    </div>
  );
}
