"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type DeleteAccountState } from "@/app/lib/session-actions";

const initialState: DeleteAccountState = {};

// 誤操作防止のため、押してすぐ削除はせず一段階確認を挟む。
export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[13px] text-[var(--accent)] hover:underline"
      >
        アカウントを削除する
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <p className="text-[12px] text-[var(--ink-soft)]">
        本当に削除しますか?表示名・メールアドレス等は消去され、元に戻せません。投稿・コメントは他の人の会話を壊さないよう「削除されたユーザー」として残ります。
      </p>
      {state.error && <p className="text-[12px] text-[var(--accent)]">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--accent)] px-3 py-1 text-[12px] font-medium text-[var(--accent-ink)] disabled:opacity-40"
        >
          {pending ? "削除中…" : "本当に削除する"}
        </button>
      </div>
    </form>
  );
}
