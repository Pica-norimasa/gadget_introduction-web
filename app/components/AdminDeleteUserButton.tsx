"use client";

import { useActionState, useState } from "react";
import { adminDeleteUser, type AdminDeleteUserState } from "@/app/lib/admin-actions";

const initialState: AdminDeleteUserState = {};

// DeleteAccountButton.tsx(本人による退会)と同じ、誤操作防止の一段階確認。
export function AdminDeleteUserButton({ userId }: { userId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(adminDeleteUser, initialState);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[12px] text-[var(--accent)] hover:underline"
      >
        削除する
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <span className="text-[12px] text-[var(--ink-soft)]">本当に削除しますか?</span>
      {state.error && <span className="text-[12px] text-[var(--accent)]">{state.error}</span>}
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
      >
        キャンセル
      </button>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-[12px] font-medium text-[var(--accent-ink)] disabled:opacity-40"
      >
        {pending ? "削除中…" : "削除する"}
      </button>
    </form>
  );
}
