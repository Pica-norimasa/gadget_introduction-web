const RESEND_API_ENDPOINT = "https://api.resend.com/emails";

export const SITE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

// Resend REST APIを直接fetchで叩くだけの薄いクライアント(cloudflare-analytics.ts
// と同じ考え方)。専用SDKを追加するほどの複雑さが無いための判断。
async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  if (!apiKey || !fromAddress) {
    throw new Error("RESEND_API_KEY または EMAIL_FROM_ADDRESS が設定されていません");
  }

  const res = await fetch(RESEND_API_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      // <meta charset>が無いHTML断片だと、一部のメールクライアントが
      // 文字コードを推測しそこねて文字化けする(件名の文字化けもこれが
      // 誘因になっているケースが多い)。完全なHTML文書として送る。
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${params.html}</body></html>`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend API error: ${res.status} ${detail}`);
  }
}

// コメント通知メール本文。プレーンテキストで十分な情報量なので装飾は
// 最小限にしている(HTMLメールクライアント間の見た目差異を気にしなくて済む)。
export async function sendCommentNotificationEmail(params: {
  to: string;
  actorName: string;
  commentPreview: string;
  targetTitle: string;
  targetUrl: string;
}): Promise<void> {
  const preview = params.commentPreview.length > 140 ? `${params.commentPreview.slice(0, 140)}…` : params.commentPreview;
  const html = `
    <p>${escapeHtml(params.actorName)}さんが「${escapeHtml(params.targetTitle)}」にコメントしました。</p>
    <p style="color:#555; border-left:3px solid #ddd; padding-left:12px;">${escapeHtml(preview)}</p>
    <p><a href="${params.targetUrl}">Draftlyで見る →</a></p>
    <p style="color:#999; font-size:12px;">この通知が不要な場合は、Draftlyの設定ページからメール通知をオフにできます。</p>
  `;

  await sendEmail({
    to: params.to,
    subject: `${params.actorName}さんがコメントしました - Draftly`,
    html,
  });
}

// 手動登録したメールアドレスの確認リンク。クリックされるまでnotifyByEmail
// (comment-actions.ts)は送信をスキップする。
export async function sendVerificationEmail(params: { to: string; verifyUrl: string }): Promise<void> {
  const html = `
    <p>Draftlyでこのメールアドレスが通知先として登録されました。</p>
    <p>あなたの操作でなければ、このメールは無視してください(登録は反映されません)。</p>
    <p><a href="${params.verifyUrl}">メールアドレスを確認する →</a></p>
    <p style="color:#999; font-size:12px;">このリンクは24時間で無効になります。</p>
  `;
  await sendEmail({ to: params.to, subject: "メールアドレスの確認 - Draftly", html });
}

// フォロー中の作者の作品が「公開中」に到達したことを知らせるメール
// (project-actions.tsのupdateProject参照)。全ステージ前進で送ると通知
// 過多になるため、一番盛り上がる最終ステージ到達時だけに絞っている。
export async function sendStageUpNotificationEmail(params: {
  to: string;
  authorName: string;
  projectTitle: string;
  projectUrl: string;
}): Promise<void> {
  const html = `
    <p>フォロー中の${escapeHtml(params.authorName)}さんの「${escapeHtml(params.projectTitle)}」が公開されました🎉</p>
    <p><a href="${params.projectUrl}">Draftlyで見る →</a></p>
    <p style="color:#999; font-size:12px;">この通知が不要な場合は、Draftlyの設定ページからメール通知をオフにできます。</p>
  `;

  await sendEmail({
    to: params.to,
    subject: `${params.authorName}さんの新作が公開されました - Draftly`,
    html,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
