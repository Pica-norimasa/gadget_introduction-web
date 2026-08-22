"use client";

import { useActionState } from "react";
import { adminLogin, type AdminLoginState } from "@/app/lib/admin-actions";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, initialState);

  return (
    <form
      action={formAction}
      className="mx-auto mt-24 flex max-w-xs flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-6"
    >
      <h1 className="text-[15px] font-bold text-[var(--ink)]">管理者ログイン</h1>
      <input
        type="password"
        name="key"
        placeholder="合言葉"
        autoFocus
        className="rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)] px-3 py-2 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
      />
      {state.error && <p className="text-[12px] text-[var(--accent)]">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-[13px] font-medium text-[var(--accent-ink)] transition-opacity disabled:opacity-40"
      >
        {pending ? "確認中…" : "入る"}
      </button>
    </form>
  );
}
