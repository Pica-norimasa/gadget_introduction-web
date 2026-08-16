"use client";

import { useTransition } from "react";
import { toggleReportResolved } from "@/app/lib/admin-actions";

export function ReportResolveButton({ reportId, resolved }: { reportId: string; resolved: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleReportResolved(reportId))}
      className={`shrink-0 rounded-full border px-3 py-1 text-[12px] transition-opacity disabled:opacity-40 ${
        resolved
          ? "border-[var(--line)] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          : "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)]"
      }`}
    >
      {pending ? "更新中…" : resolved ? "未対応に戻す" : "対応済みにする"}
    </button>
  );
}
