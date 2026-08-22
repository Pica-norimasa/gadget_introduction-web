"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/app/lib/session-actions";

export function ResendVerificationButton() {
  const [sent, setSent] = useState(false);

  async function handleClick() {
    setSent(true);
    await resendVerificationEmail();
  }

  if (sent) {
    return <span className="text-[12px] text-[var(--ink-faint)]">確認メールを送信しました</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-[12px] text-[var(--accent)] hover:underline"
    >
      確認メールを再送信
    </button>
  );
}
