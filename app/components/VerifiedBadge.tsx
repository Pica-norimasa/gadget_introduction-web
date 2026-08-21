// GitHub/X/Google/LINEいずれかで実際にログインした作者にだけ付く小さな
// チェックマーク。ゲスト投稿と見分けるための印(queries.tsのauthorVerified
// 参照)。@ハンドル表示(Xのみ)とは独立していて、Xに連携していなくても
// (Google/LINEログインでも)付く。
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-label="ログイン済み" className={className}>
      <title>ログイン済み</title>
      <circle cx="10" cy="10" r="10" fill="var(--teal)" />
      <path
        d="M6 10.2l2.4 2.4L14 7"
        stroke="var(--teal-soft)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
