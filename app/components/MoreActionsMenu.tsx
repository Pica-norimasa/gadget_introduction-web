"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toggleBlock, useIsBlocked } from "@/app/lib/block-store";
import { toggleMute, useIsMuted } from "@/app/lib/mute-store";
import { submitReport, type ReportTargetType, type SubmitReportState } from "@/app/lib/report-actions";

const initialState: SubmitReportState = {};

const REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "スパム" },
  { value: "inappropriate", label: "不適切な内容" },
  { value: "impersonation", label: "なりすまし・詐称" },
  { value: "other", label: "その他" },
];

function ReportForm({
  target,
  onSuccess,
  onCancel,
}: {
  target: { type: ReportTargetType; id: string };
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(submitReport, initialState);
  const [reason, setReason] = useState<string>(REASONS[0].value);

  useEffect(() => {
    if (state.success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSuccessは呼び出し元で毎回新しい関数になり得るため依存に含めない
  }, [state.success]);

  return (
    <form
      action={formAction}
      className="absolute right-0 top-9 z-30 flex w-64 flex-col gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 shadow-[0_8px_24px_var(--shadow)]"
    >
      <input type="hidden" name="targetType" value={target.type} />
      <input type="hidden" name="targetId" value={target.id} />
      <p className="text-[13px] font-medium text-[var(--ink)]">通報する</p>
      <div className="flex flex-col gap-1">
        {REASONS.map((r) => (
          <label key={r.value} className="flex items-center gap-1.5 text-[12.5px] text-[var(--ink-soft)]">
            <input
              type="radio"
              name="reason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
            />
            {r.label}
          </label>
        ))}
      </div>
      <textarea
        name="detail"
        rows={2}
        maxLength={300}
        placeholder="詳細(任意)"
        className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--bg-sunken)] p-2 text-[12.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-[var(--accent)]">{state.error}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--accent)] px-3 py-1 text-[12px] font-medium text-[var(--accent-ink)] disabled:opacity-40"
          >
            {pending ? "送信中…" : "通報する"}
          </button>
        </div>
      </div>
    </form>
  );
}

type Panel = "closed" | "menu" | "form" | "done";

// プロジェクト/コメント/ユーザーに対する「⋯」その他操作メニュー。
// ミュート・ブロックは常に対象コンテンツの「作者」に対する操作なので、
// reportTarget(通報対象そのもの)とは別にauthorを受け取る。「⋯」→
// メニュー→(通報の場合のみ)理由選択フォーム、という段階を
// NotificationBellと同じクリック外側で閉じるドロップダウンパターンで
// 実現している。
export function MoreActionsMenu({
  reportTarget,
  author,
}: {
  reportTarget: { type: ReportTargetType; id: string };
  author: { id: string; name: string };
}) {
  const [panel, setPanel] = useState<Panel>("closed");
  const ref = useRef<HTMLDivElement>(null);
  const muted = useIsMuted(author.id);
  const blocked = useIsBlocked(author.id);

  useEffect(() => {
    if (panel === "closed") return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setPanel("closed");
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [panel]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="その他の操作"
        onClick={() => setPanel((p) => (p === "closed" ? "menu" : "closed"))}
        className="grid h-7 w-7 place-items-center rounded-full text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-soft)]"
      >
        <span aria-hidden>⋯</span>
      </button>

      {panel === "menu" && (
        <div className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-1 shadow-[0_8px_24px_var(--shadow)]">
          <button
            type="button"
            onClick={() => {
              toggleMute(author.id);
              setPanel("closed");
            }}
            className="w-full truncate rounded-lg px-3 py-2 text-left text-[13px] text-[var(--ink-soft)] hover:bg-[var(--bg-sunken)]"
          >
            {muted ? "🔊 ミュート解除" : `🔇 ${author.name}さんをミュート`}
          </button>
          <button
            type="button"
            onClick={() => {
              toggleBlock(author.id);
              setPanel("closed");
            }}
            className="w-full truncate rounded-lg px-3 py-2 text-left text-[13px] text-[var(--ink-soft)] hover:bg-[var(--bg-sunken)]"
          >
            {blocked ? "🚫 ブロック解除" : `🚫 ${author.name}さんをブロック`}
          </button>
          <button
            type="button"
            onClick={() => setPanel("form")}
            className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-[var(--ink-soft)] hover:bg-[var(--bg-sunken)]"
          >
            🚩 通報する
          </button>
        </div>
      )}

      {panel === "form" && (
        <ReportForm target={reportTarget} onSuccess={() => setPanel("done")} onCancel={() => setPanel("closed")} />
      )}

      {panel === "done" && (
        <div className="absolute right-0 top-9 z-30 w-64 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] p-3 text-[13px] text-[var(--ink-soft)] shadow-[0_8px_24px_var(--shadow)]">
          通報を受け付けました。ご協力ありがとうございます。
        </div>
      )}
    </div>
  );
}
