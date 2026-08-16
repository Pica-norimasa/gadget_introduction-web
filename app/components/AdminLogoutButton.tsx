"use client";

import { adminLogout } from "@/app/lib/admin-actions";

export function AdminLogoutButton() {
  return (
    <button
      type="button"
      onClick={() => void adminLogout()}
      className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
    >
      ログアウト
    </button>
  );
}
