"use client";

import { useActionState, useState } from "react";
import { deleteProject, type DeleteProjectState } from "@/app/lib/project-actions";

const initialState: DeleteProjectState = {};

// DeleteAccountButton.tsxと同じ、誤操作防止のための一段階確認パターン。
export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteProject, initialState);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-faint)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        削除する
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3">
      <input type="hidden" name="projectId" value={projectId} />
      <p className="text-[12px] text-[var(--ink-soft)]">
        本当に削除しますか?タイムライン投稿・コメント・リアクション等もすべて削除され、元に戻せません。
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
