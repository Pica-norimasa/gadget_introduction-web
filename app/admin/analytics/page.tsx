import type { Metadata } from "next";
import Link from "next/link";
import { isAdminAuthed } from "@/app/lib/admin-auth";
import { getDailyVisitStats } from "@/app/lib/cloudflare-analytics";
import { AdminLoginForm } from "@/app/components/AdminLoginForm";
import { AdminLogoutButton } from "@/app/components/AdminLogoutButton";

export const metadata: Metadata = { title: "アクセス状況 | Draftly Admin" };

function sum(stats: { uniques: number; requests: number }[], key: "uniques" | "requests") {
  return stats.reduce((total, s) => total + s[key], 0);
}

export default async function AdminAnalyticsPage() {
  const authed = await isAdminAuthed();
  if (!authed) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4">
        <AdminLoginForm />
      </div>
    );
  }

  let stats: Awaited<ReturnType<typeof getDailyVisitStats>> = [];
  let loadError: string | null = null;
  try {
    stats = await getDailyVisitStats(30);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "取得に失敗しました";
  }

  const today = stats.at(-1);
  const last7 = stats.slice(-7);
  const last30 = stats;

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
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard label="本日(集計中)" value={today?.uniques ?? 0} />
              <SummaryCard label="過去7日間の合計" value={sum(last7, "uniques")} />
              <SummaryCard label="過去30日間の合計" value={sum(last30, "uniques")} />
            </div>

            <p className="mb-3 text-[12px] text-[var(--ink-faint)]">
              ※ Cloudflareの日別集計による概算値です。日をまたいで訪れた同一人物は日ごとに1人としてそれぞれ数えられます。
            </p>

            <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[12px] text-[var(--ink-faint)]">
                    <th className="px-4 py-2 font-medium">日付</th>
                    <th className="px-4 py-2 font-medium tabular-nums">ユニーク訪問者</th>
                    <th className="px-4 py-2 font-medium tabular-nums">リクエスト数</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats].reverse().map((s) => (
                    <tr key={s.date} className="border-b border-[var(--line)] last:border-0">
                      <td className="px-4 py-2 text-[var(--ink)]">{s.date}</td>
                      <td className="px-4 py-2 tabular-nums text-[var(--ink)]">{s.uniques.toLocaleString("ja-JP")}</td>
                      <td className="px-4 py-2 tabular-nums text-[var(--ink-faint)]">
                        {s.requests.toLocaleString("ja-JP")}
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <p className="mb-1 text-[12px] text-[var(--ink-faint)]">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums text-[var(--ink)]">
        {value.toLocaleString("ja-JP")}
      </p>
    </div>
  );
}
