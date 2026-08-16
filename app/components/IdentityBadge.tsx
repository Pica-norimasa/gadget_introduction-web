"use client";

import { useActionState, useEffect, useState } from "react";
import { updateDisplayName, type UpdateNameState } from "@/app/lib/session-actions";

const initialState: UpdateNameState = {};

export function IdentityBadge({ name }: { name: string | null }) {
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
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="表示名を変更"
        className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1.5 text-[13px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)] sm:px-3"
      >
        <span aria-hidden>👤</span>
        {/* モバイル幅ではアイコンだけにして、ヘッダーの横幅を圧迫しないようにする */}
        <span className="hidden sm:inline">{name ?? "ゲスト"}</span>
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input
        type="text"
        name="name"
        defaultValue={name ?? ""}
        maxLength={20}
        autoFocus
        placeholder="表示名"
        className="w-24 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-1.5 text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] sm:w-28"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-[12px] font-medium text-[var(--accent-ink)] disabled:opacity-40"
      >
        {pending ? "…" : "保存"}
      </button>
      {state.error && <span className="text-[11px] text-[var(--accent)]">{state.error}</span>}
    </form>
  );
}
