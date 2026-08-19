// 荒らし・スパム対策の簡易レート制限。Redis等は使わず、既存のDBの
// createdAt列を数えるだけの軽量な実装(このアプリの規模ではこれで十分)。
// 「直近N分にX件」をここで計算した起点時刻を使って各Server Action側で
// 個別にcountするだけなので、テーブルをまたぐ共通化はしていない。
export function rateLimitWindowStart(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}
