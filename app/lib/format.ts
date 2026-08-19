export function formatRelativeHours(hoursAgo: number): string {
  if (hoursAgo < 1) return `${Math.max(1, Math.round(hoursAgo * 60))}分前`;
  if (hoursAgo < 24) return `${Math.round(hoursAgo)}時間前`;
  return `${Math.round(hoursAgo / 24)}日前`;
}

export function formatPostedAgo(daysAgo: number): string {
  if (daysAgo === 0) return "今日";
  return `${daysAgo}日前`;
}

// Xのインプレッション表示に寄せた表記。1万未満はそのまま、以降は「1.2万」のように丸める。
export function formatCount(n: number): string {
  if (n >= 10000) {
    const man = n / 10000;
    return `${man >= 100 ? Math.round(man) : man.toFixed(1).replace(/\.0$/, "")}万`;
  }
  return n.toLocaleString("ja-JP");
}
