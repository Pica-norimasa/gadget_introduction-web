"use client";

import { useActionState, useEffect, useState } from "react";
import { updateEmail, type UpdateEmailState } from "@/app/lib/session-actions";

const initialState: UpdateEmailState = {};

// BioEditor.tsxと同じ表示⇔編集トグルパターン。
export function EmailAddressForm({ email }: { email: string | null }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateEmail, initialState);

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Actionの成功を受けて編集モードを閉じる
      setEditing(false);
    }
  }, [state.success]);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-[13.5px] text-[var(--ink)]">{email ?? "未設定"}</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink)]"
        >
          編集
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input
        type="email"
        name="email"
        defaultValue={email ?? ""}
        autoFocus
        placeholder="you@example.com"
        className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)] px-3 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-[var(--accent)]">{state.error}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--accent)] px-3 py-1 text-[12px] font-medium text-[var(--accent-ink)] disabled:opacity-40"
          >
            {pending ? "…" : "保存"}
          </button>
        </div>
      </div>
    </form>
  );
}
