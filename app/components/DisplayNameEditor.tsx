"use client";

import { useActionState, useEffect, useState } from "react";
import { updateDisplayName, type UpdateNameState } from "@/app/lib/session-actions";

const initialState: UpdateNameState = {};

// プロフィールページで自分の表示名を表示・編集する。BioEditor
// (自己紹介編集)・IdentityBadge(ヘッダーの表示名編集)と同じ、
// 表示⇔編集のトグルパターン。
export function DisplayNameEditor({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateDisplayName, initialState);

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Server Actionの成功を受けて編集モードを閉じる
      setEditing(false);
    }
  }, [state.success]);

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
          {name}
        </h1>
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="表示名を変更"
          aria-label="表示名を変更"
          className="shrink-0 rounded-full p-1 text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-soft)]"
        >
          <span aria-hidden>✏️</span>
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input
        type="text"
        name="name"
        defaultValue={name}
        maxLength={20}
        autoFocus
        placeholder="表示名"
        className="w-full max-w-56 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-1.5 text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
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
