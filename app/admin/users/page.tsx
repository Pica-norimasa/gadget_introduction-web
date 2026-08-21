import type { Metadata } from "next";
import Link from "next/link";
import { isAdminAuthed } from "@/app/lib/admin-auth";
import { getAdminUsers } from "@/app/lib/queries";
import { AdminLoginForm } from "@/app/components/AdminLoginForm";
import { AdminLogoutButton } from "@/app/components/AdminLogoutButton";
import { AdminNav } from "@/app/components/AdminNav";
import { AdminDeleteUserButton } from "@/app/components/AdminDeleteUserButton";
import type { AdminUserKind } from "@/app/lib/queries";

export const metadata: Metadata = { title: "ユーザー一覧 | Draftly Admin" };

const PAGE_SIZE = 20;

const KIND_LABELS: Record<AdminUserKind, string> = {
  github: "GitHub",
  x: "X",
  google: "Google",
  line: "LINE",
  guest: "ゲスト",
  seed: "シード/Bot",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const authed = await isAdminAuthed();
  if (!authed) {
    return (
      <div className="min-h-screen bg-[var(--bg)] px-4">
        <AdminLoginForm />
      </div>
    );
  }

  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const { users, total } = await getAdminUsers(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
            ユーザー一覧({total})
          </h1>
          <AdminLogoutButton />
        </div>

        <AdminNav active="users" />

        <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[12px] text-[var(--ink-faint)]">
                <th className="px-4 py-2 font-medium">ユーザー</th>
                <th className="px-4 py-2 font-medium">メール</th>
                <th className="px-4 py-2 font-medium">連携</th>
                <th className="px-4 py-2 font-medium">登録日</th>
                <th className="px-4 py-2 font-medium">状態</th>
                <th className="px-4 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-2 text-[var(--ink)]">
                    {u.deletedAt ? (
                      <span className="text-[var(--ink-faint)]">{u.displayName ?? u.name}</span>
                    ) : (
                      <Link href={`/u/${encodeURIComponent(u.name)}`} className="text-[var(--accent)] hover:underline">
                        {u.displayName ?? u.name}
                      </Link>
                    )}
                    <span className="ml-1.5 text-[11px] text-[var(--ink-faint)]">@{u.name}</span>
                  </td>
                  <td className="px-4 py-2 text-[var(--ink-faint)]">{u.email ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        u.kind === "seed"
                          ? "rounded-full bg-[var(--bg-sunken)] px-2 py-0.5 text-[11px] text-[var(--ink-faint)]"
                          : "text-[var(--ink-faint)]"
                      }
                    >
                      {KIND_LABELS[u.kind]}
                    </span>
                  </td>
                  <td className="px-4 py-2 tabular-nums text-[var(--ink-faint)]">
                    {u.createdAt.toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-2">
                    {u.deletedAt ? (
                      <span className="rounded-full bg-[var(--bg-sunken)] px-2 py-0.5 text-[11px] text-[var(--ink-faint)]">
                        削除済み
                      </span>
                    ) : (
                      <span className="rounded-full border border-[var(--teal)] px-2 py-0.5 text-[11px] text-[var(--teal)]">
                        有効
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{!u.deletedAt && <AdminDeleteUserButton userId={u.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href={`/admin/users?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={`rounded-full border border-[var(--line)] px-3 py-1.5 text-[12px] ${
              page <= 1
                ? "pointer-events-none opacity-40"
                : "text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
            }`}
          >
            ← 前へ
          </Link>
          <span className="text-[12px] text-[var(--ink-faint)]">
            {page} / {totalPages}
          </span>
          <Link
            href={`/admin/users?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={`rounded-full border border-[var(--line)] px-3 py-1.5 text-[12px] ${
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
            }`}
          >
            次へ →
          </Link>
        </div>
      </div>
    </div>
  );
}
