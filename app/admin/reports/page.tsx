import type { Metadata } from "next";
import Link from "next/link";
import { isAdminAuthed } from "@/app/lib/admin-auth";
import { getAllReports } from "@/app/lib/queries";
import { AdminLoginForm } from "@/app/components/AdminLoginForm";
import { AdminLogoutButton } from "@/app/components/AdminLogoutButton";
import { ReportResolveButton } from "@/app/components/ReportResolveButton";

export const metadata: Metadata = { title: "通報一覧 | Draftly Admin" };

const REASON_LABELS: Record<string, string> = {
  spam: "スパム",
  inappropriate: "不適切な内容",
  impersonation: "なりすまし・詐称",
  other: "その他",
};

type Filter = "unresolved" | "resolved" | "all";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "unresolved", label: "未対応" },
  { id: "resolved", label: "対応済み" },
  { id: "all", label: "すべて" },
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const authed = await isAdminAuthed();
  if (!authed) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4">
        <AdminLoginForm />
      </div>
    );
  }

  const { filter: filterRaw } = await searchParams;
  const filter: Filter = filterRaw === "resolved" || filterRaw === "all" ? filterRaw : "unresolved";

  const reports = await getAllReports();
  const unresolvedCount = reports.filter((r) => !r.resolvedAt).length;
  const resolvedCount = reports.length - unresolvedCount;
  const counts: Record<Filter, number> = { unresolved: unresolvedCount, resolved: resolvedCount, all: reports.length };

  const visible = reports.filter((r) => {
    if (filter === "unresolved") return !r.resolvedAt;
    if (filter === "resolved") return !!r.resolvedAt;
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
            通報一覧({reports.length})
          </h1>
          <AdminLogoutButton />
        </div>

        <div className="mb-6 flex items-center gap-1 border-b border-[var(--line)]">
          <Link
            href="/admin/analytics"
            className="px-3 py-2 text-sm font-medium text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          >
            アクセス状況
          </Link>
          <span className="relative px-3 py-2 text-sm font-medium text-[var(--ink)]">
            通報一覧
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />
          </span>
        </div>

        <div className="mb-4 flex items-center gap-1 border-b border-[var(--line)]">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={f.id === "unresolved" ? "/admin/reports" : `/admin/reports?filter=${f.id}`}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                filter === f.id ? "text-[var(--ink)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
              }`}
            >
              {f.label}({counts[f.id]})
              {filter === f.id && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />
              )}
            </Link>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="text-[13px] text-[var(--ink-faint)]">
            {filter === "unresolved" ? "未対応の通報はありません" : filter === "resolved" ? "対応済みの通報はありません" : "通報はまだありません"}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((r) => (
              <div
                key={r.id}
                className={`rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 ${
                  r.resolvedAt ? "opacity-60" : ""
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[var(--ink-faint)]">
                  <span>
                    {REASON_LABELS[r.reason] ?? r.reason} ・ 通報者: {r.reporterName} ・{" "}
                    {r.createdAt.toLocaleString("ja-JP")}
                    {r.resolvedAt && ` ・ 対応済み(${r.resolvedAt.toLocaleString("ja-JP")})`}
                  </span>
                  <span className="rounded-full border border-[var(--line)] px-2 py-0.5">{r.targetType}</span>
                </div>
                {r.detail && <p className="mb-2 text-[13px] text-[var(--ink)]">{r.detail}</p>}
                <div className="mb-3 text-[13px] text-[var(--ink-soft)]">
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
                  {r.target.kind === "post" && (
                    <Link href={`/post/${r.target.id}`} className="text-[var(--accent)] hover:underline">
                      対象の投稿: {r.target.body.slice(0, 60)} →
                    </Link>
                  )}
                  {r.target.kind === "unknown" && (
                    <span className="text-[var(--ink-faint)]">(対象が見つかりません。削除済みの可能性があります)</span>
                  )}
                </div>
                <ReportResolveButton reportId={r.id} resolved={!!r.resolvedAt} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
