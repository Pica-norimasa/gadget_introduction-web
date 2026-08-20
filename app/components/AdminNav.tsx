import Link from "next/link";

const TABS = [
  { id: "analytics", href: "/admin/analytics", label: "アクセス状況" },
  { id: "reports", href: "/admin/reports", label: "通報一覧" },
  { id: "users", href: "/admin/users", label: "ユーザー一覧" },
] as const;

// /admin/analytics・/admin/reports・/admin/usersの3画面で同じタブ行を
// コピペしていたのをここに集約した。
export function AdminNav({ active }: { active: (typeof TABS)[number]["id"] }) {
  return (
    <div className="mb-6 flex items-center gap-1 border-b border-[var(--line)]">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={`relative px-3 py-2 text-sm font-medium transition-colors ${
            t.id === active ? "text-[var(--ink)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          }`}
        >
          {t.label}
          {t.id === active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />}
        </Link>
      ))}
    </div>
  );
}
