import type { Metadata } from "next";
import Link from "next/link";
import { isAdminAuthed } from "@/app/lib/admin-auth";
import { getAllReports } from "@/app/lib/queries";
import { AdminLoginForm } from "@/app/components/AdminLoginForm";
import { AdminLogoutButton } from "@/app/components/AdminLogoutButton";

export const metadata: Metadata = { title: "通報一覧 | Draftly Admin" };

const REASON_LABELS: Record<string, string> = {
  spam: "スパム",
  inappropriate: "不適切な内容",
  impersonation: "なりすまし・詐称",
  other: "その他",
};

export default async function AdminReportsPage() {
  const authed = await isAdminAuthed();
  if (!authed) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4">
        <AdminLoginForm />
      </div>
    );
  }

  const reports = await getAllReports();

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
            通報一覧({reports.length})
          </h1>
          <AdminLogoutButton />
        </div>

        {reports.length === 0 ? (
          <p className="text-[13px] text-[var(--ink-faint)]">通報はまだありません</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[var(--ink-faint)]">
                  <span>
                    {REASON_LABELS[r.reason] ?? r.reason} ・ 通報者: {r.reporterName} ・{" "}
                    {r.createdAt.toLocaleString("ja-JP")}
                  </span>
                  <span className="rounded-full border border-[var(--line)] px-2 py-0.5">{r.targetType}</span>
                </div>
                {r.detail && <p className="mb-2 text-[13px] text-[var(--ink)]">{r.detail}</p>}
                <div className="text-[13px] text-[var(--ink-soft)]">
                  {r.target.kind === "project" && (
                    <Link href={`/work/${r.target.id}`} className="text-[var(--accent)] hover:underline">
                      対象の作品: {r.target.title} →
                    </Link>
                  )}
                  {r.target.kind === "comment" && (r.target.projectId || r.target.postId) && (
                    <Link
                      href={r.target.projectId ? `/work/${r.target.projectId}` : `/post/${r.target.postId}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      対象のコメント: {r.target.body.slice(0, 60)} →
                    </Link>
                  )}
                  {r.target.kind === "user" && (
                    <Link
                      href={`/u/${encodeURIComponent(r.target.name)}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      対象のユーザー: {r.target.name} →
                    </Link>
                  )}
                  {r.target.kind === "unknown" && (
                    <span className="text-[var(--ink-faint)]">(対象が見つかりません。削除済みの可能性があります)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
